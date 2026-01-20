/**
 * Noetium Visual Content Pipeline
 * 
 * AI-powered image generation service for educational content.
 * Supports Google Imagen 3 (primary) and DALL-E 3 (fallback).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ============================================================================
// Types
// ============================================================================

export type EnrichmentSubject = 
  | 'philosophy_logic'
  | 'cs_computational'
  | 'financial_literacy'
  | 'me_new_world'
  | 'art_creativity';

export type GradeLevel = 
  | 'a_dimotikou' | 'b_dimotikou' | 'g_dimotikou' | 'd_dimotikou' | 'e_dimotikou' | 'st_dimotikou'
  | 'a_gymnasiou' | 'b_gymnasiou' | 'g_gymnasiou'
  | 'a_lykeiou' | 'b_lykeiou' | 'g_lykeiou';

export type ImageStyle = 
  | 'cartoon_friendly'  // For young children
  | 'educational'       // Clean, informative
  | 'realistic'         // Photorealistic
  | 'comic_strip'       // Comic panel style
  | 'minimal'           // Simple, clean
  | 'artistic';         // Creative/expressive

export type ImageProvider = 'imagen' | 'dalle';

export interface ImageGenerationRequest {
  subject: EnrichmentSubject;
  gradeLevel: GradeLevel;
  topic: string;
  style: ImageStyle;
  language?: 'el' | 'en';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
  forceRegenerate?: boolean;
}

export interface GeneratedImage {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  prompt: string;
  sanitizedPrompt: string;
  provider: ImageProvider;
  cost: number;
  cached: boolean;
  metadata: ImageMetadata;
  createdAt: Date;
}

export interface ImageMetadata {
  subject: EnrichmentSubject;
  gradeLevel: GradeLevel;
  style: ImageStyle;
  width: number;
  height: number;
  fileSize?: number;
}

export interface VisualLibraryItem {
  id: string;
  promptHash: string;
  category: string;
  subcategory?: string;
  imageUrl: string;
  thumbnailUrl: string;
  prompt: string;
  provider: ImageProvider;
  cost: number;
  gradeMin: GradeLevel;
  gradeMax: GradeLevel;
  altText: string;
  altTextEl: string;
  tags: string[];
  usageCount: number;
  createdAt: Date;
}

// ============================================================================
// Configuration
// ============================================================================

interface VisualContentConfig {
  supabaseUrl: string;
  supabaseKey: string;
  imagenProjectId?: string;
  imagenLocation?: string;
  openaiApiKey?: string;
  defaultProvider: ImageProvider;
  storageBucket: string;
  maxCacheAge: number; // days
}

// Safety configuration
const BLOCKED_TERMS = [
  // Violence
  'weapon', 'gun', 'blood', 'fight', 'war', 'kill', 'death', 'violent',
  // Inappropriate  
  'nude', 'naked', 'sexy', 'adult', 'erotic', 'nsfw',
  // Harmful
  'drug', 'alcohol', 'cigarette', 'smoking', 'beer', 'wine',
  // Other concerns
  'scary', 'horror', 'monster', 'nightmare', 'creepy'
];

const SAFETY_TERMS_BY_AGE = {
  primary: BLOCKED_TERMS.concat(['scary', 'dark', 'dangerous']),
  gymnasio: BLOCKED_TERMS,
  lykeio: BLOCKED_TERMS.filter(t => !['fight', 'war', 'dark'].includes(t)) // Allow some historical context
};

// Style modifiers for prompt building
const STYLE_MODIFIERS: Record<ImageStyle, string> = {
  cartoon_friendly: 'friendly cartoon style, soft pastel colors, rounded shapes, cute characters, child-appropriate, cheerful, no scary elements, simple background',
  educational: 'clean educational illustration, professional, clear labels if needed, simple composition, informative, white or light background',
  realistic: 'photorealistic, highly detailed, natural lighting, accurate representation, professional photography style',
  comic_strip: '4-panel comic strip style, clear speech bubbles, expressive cartoon characters, vibrant colors, manga-inspired',
  minimal: 'minimalist design, simple shapes, limited color palette, clean lines, modern, white space',
  artistic: 'artistic illustration, creative expression, unique style, painterly, expressive brushstrokes'
};

// Age-appropriate modifiers
const AGE_MODIFIERS: Record<string, string> = {
  primary_lower: 'very simple, bright primary colors, large friendly characters, playful, suitable for ages 6-8',
  primary_upper: 'colorful, engaging, educational, slightly more detailed, suitable for ages 8-12',
  gymnasio: 'teen-appropriate, modern style, more sophisticated, suitable for ages 12-15',
  lykeio: 'professional quality, mature themes handled tastefully, artistic, suitable for ages 15-18'
};

// Subject-specific prompt additions
const SUBJECT_CONTEXT: Record<EnrichmentSubject, string> = {
  philosophy_logic: 'depicting philosophical concepts, showing people thinking or discussing',
  cs_computational: 'showing technology, computers, coding concepts, algorithms visualized',
  financial_literacy: 'depicting money, business, entrepreneurship, financial concepts',
  me_new_world: 'showing emotions, nature, sustainability, social connections, mindfulness',
  art_creativity: 'artistic, creative, showing art materials, creative process, imagination'
};

// ============================================================================
// Main Service Class
// ============================================================================

export class VisualContentService {
  private supabase: SupabaseClient;
  private config: VisualContentConfig;
  
  constructor(config: VisualContentConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }
  
  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------
  
  /**
   * Generate an image for educational content
   */
  async generateImage(request: ImageGenerationRequest): Promise<GeneratedImage> {
    // Validate the request
    const validation = this.validateRequest(request);
    if (!validation.valid) {
      throw new Error(`Invalid request: ${validation.reason}`);
    }
    
    // Build the prompt
    const prompt = this.buildPrompt(request);
    const promptHash = this.hashPrompt(prompt);
    
    // Check cache unless force regenerate
    if (!request.forceRegenerate) {
      const cached = await this.getCachedImage(promptHash);
      if (cached) {
        // Update usage count
        await this.incrementUsageCount(cached.id);
        return {
          id: cached.id,
          imageUrl: cached.imageUrl,
          thumbnailUrl: cached.thumbnailUrl,
          prompt: cached.prompt,
          sanitizedPrompt: prompt,
          provider: cached.provider as ImageProvider,
          cost: 0, // Free from cache
          cached: true,
          metadata: {
            subject: request.subject,
            gradeLevel: request.gradeLevel,
            style: request.style,
            width: 1024,
            height: 1024
          },
          createdAt: cached.createdAt
        };
      }
    }
    
    // Generate new image
    let result: { imageData: string; provider: ImageProvider; cost: number };
    
    try {
      // Try primary provider (Imagen)
      if (this.config.defaultProvider === 'imagen' && this.config.imagenProjectId) {
        result = await this.generateWithImagen(prompt, request);
      } else {
        result = await this.generateWithDalle(prompt, request);
      }
    } catch (error) {
      console.error(`Primary provider failed:`, error);
      
      // Fallback to other provider
      try {
        if (this.config.defaultProvider === 'imagen') {
          result = await this.generateWithDalle(prompt, request);
        } else if (this.config.imagenProjectId) {
          result = await this.generateWithImagen(prompt, request);
        } else {
          throw error;
        }
      } catch (fallbackError) {
        throw new Error(`All image providers failed: ${fallbackError}`);
      }
    }
    
    // Upload to storage
    const { imageUrl, thumbnailUrl } = await this.uploadImage(
      result.imageData,
      promptHash,
      request.subject
    );
    
    // Cache the result
    const savedItem = await this.cacheImage({
      promptHash,
      category: request.subject,
      subcategory: request.topic.split(' ')[0],
      imageUrl,
      thumbnailUrl,
      prompt,
      provider: result.provider,
      cost: result.cost,
      gradeMin: this.getGradeRangeMin(request.gradeLevel),
      gradeMax: this.getGradeRangeMax(request.gradeLevel),
      altText: this.generateAltText(request, 'en'),
      altTextEl: this.generateAltText(request, 'el'),
      tags: this.generateTags(request)
    });
    
    return {
      id: savedItem.id,
      imageUrl,
      thumbnailUrl,
      prompt,
      sanitizedPrompt: prompt,
      provider: result.provider,
      cost: result.cost,
      cached: false,
      metadata: {
        subject: request.subject,
        gradeLevel: request.gradeLevel,
        style: request.style,
        width: 1024,
        height: 1024
      },
      createdAt: new Date()
    };
  }
  
  /**
   * Search the visual library
   */
  async searchLibrary(
    query: string,
    filters?: {
      subject?: EnrichmentSubject;
      gradeLevel?: GradeLevel;
      tags?: string[];
      limit?: number;
    }
  ): Promise<VisualLibraryItem[]> {
    let queryBuilder = this.supabase
      .from('visual_library')
      .select('*')
      .order('usage_count', { ascending: false });
    
    // Full-text search
    if (query) {
      queryBuilder = queryBuilder.textSearch('search_vector', query);
    }
    
    // Filters
    if (filters?.subject) {
      queryBuilder = queryBuilder.eq('category', filters.subject);
    }
    
    if (filters?.tags?.length) {
      queryBuilder = queryBuilder.overlaps('tags', filters.tags);
    }
    
    if (filters?.limit) {
      queryBuilder = queryBuilder.limit(filters.limit);
    }
    
    const { data, error } = await queryBuilder;
    
    if (error) throw error;
    
    return data.map(this.mapDbToLibraryItem);
  }
  
  /**
   * Get a specific image by ID
   */
  async getImage(id: string): Promise<VisualLibraryItem | null> {
    const { data, error } = await this.supabase
      .from('visual_library')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    
    return this.mapDbToLibraryItem(data);
  }
  
  /**
   * Get pre-generated images for a subject/topic
   */
  async getPreGeneratedImages(
    subject: EnrichmentSubject,
    topic?: string,
    limit = 10
  ): Promise<VisualLibraryItem[]> {
    let queryBuilder = this.supabase
      .from('visual_library')
      .select('*')
      .eq('category', subject)
      .order('usage_count', { ascending: false })
      .limit(limit);
    
    if (topic) {
      queryBuilder = queryBuilder.ilike('subcategory', `%${topic}%`);
    }
    
    const { data, error } = await queryBuilder;
    
    if (error) throw error;
    
    return data.map(this.mapDbToLibraryItem);
  }
  
  // --------------------------------------------------------------------------
  // Provider Implementations
  // --------------------------------------------------------------------------
  
  private async generateWithImagen(
    prompt: string,
    request: ImageGenerationRequest
  ): Promise<{ imageData: string; provider: 'imagen'; cost: number }> {
    // Note: This requires @google-cloud/aiplatform to be installed
    // and proper Google Cloud authentication set up
    
    const aspectRatioMap: Record<string, string> = {
      '1:1': '1:1',
      '16:9': '16:9',
      '9:16': '9:16',
      '4:3': '4:3'
    };
    
    const response = await fetch(
      `https://${this.config.imagenLocation}-aiplatform.googleapis.com/v1/projects/${this.config.imagenProjectId}/locations/${this.config.imagenLocation}/publishers/google/models/imagen-3.0-fast-generate-001:predict`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getGoogleAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: aspectRatioMap[request.aspectRatio || '1:1'] || '1:1',
            safetyFilterLevel: 'block_some',
            personGeneration: 'dont_allow', // For safety
            language: request.language || 'en'
          }
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Imagen API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      imageData: data.predictions[0].bytesBase64Encoded,
      provider: 'imagen',
      cost: 0.02 // Imagen 3 Fast pricing
    };
  }
  
  private async generateWithDalle(
    prompt: string,
    request: ImageGenerationRequest
  ): Promise<{ imageData: string; provider: 'dalle'; cost: number }> {
    const sizeMap: Record<string, string> = {
      '1:1': '1024x1024',
      '16:9': '1792x1024',
      '9:16': '1024x1792',
      '4:3': '1024x1024' // DALL-E doesn't support 4:3, use square
    };
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: sizeMap[request.aspectRatio || '1:1'] || '1024x1024',
        quality: 'standard',
        style: 'vivid',
        response_format: 'b64_json'
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`DALL-E API error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      imageData: data.data[0].b64_json,
      provider: 'dalle',
      cost: 0.04 // DALL-E 3 standard pricing
    };
  }
  
  // --------------------------------------------------------------------------
  // Prompt Building
  // --------------------------------------------------------------------------
  
  private buildPrompt(request: ImageGenerationRequest): string {
    const parts: string[] = [];
    
    // Safety prefix
    parts.push('Safe for children, educational, no violence, no inappropriate content.');
    
    // Style
    parts.push(STYLE_MODIFIERS[request.style]);
    
    // Age appropriateness
    const ageGroup = this.getAgeGroup(request.gradeLevel);
    parts.push(AGE_MODIFIERS[ageGroup]);
    
    // Subject context
    parts.push(SUBJECT_CONTEXT[request.subject]);
    
    // Sanitized topic
    const sanitizedTopic = this.sanitizeTopic(request.topic, request.gradeLevel);
    parts.push(`Topic: ${sanitizedTopic}`);
    
    return parts.join(' ');
  }
  
  private sanitizeTopic(topic: string, gradeLevel: GradeLevel): string {
    // Get age-appropriate blocked terms
    const ageGroup = this.getAgeGroup(gradeLevel);
    const blockedList = SAFETY_TERMS_BY_AGE[ageGroup.split('_')[0] as keyof typeof SAFETY_TERMS_BY_AGE] 
      || BLOCKED_TERMS;
    
    // Remove blocked terms
    let sanitized = topic.toLowerCase();
    for (const term of blockedList) {
      sanitized = sanitized.replace(new RegExp(`\\b${term}\\b`, 'gi'), '');
    }
    
    // Clean up extra spaces
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    // Capitalize first letter
    return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
  }
  
  private getAgeGroup(gradeLevel: GradeLevel): string {
    const mapping: Record<string, string> = {
      'a_dimotikou': 'primary_lower',
      'b_dimotikou': 'primary_lower',
      'g_dimotikou': 'primary_upper',
      'd_dimotikou': 'primary_upper',
      'e_dimotikou': 'primary_upper',
      'st_dimotikou': 'primary_upper',
      'a_gymnasiou': 'gymnasio',
      'b_gymnasiou': 'gymnasio',
      'g_gymnasiou': 'gymnasio',
      'a_lykeiou': 'lykeio',
      'b_lykeiou': 'lykeio',
      'g_lykeiou': 'lykeio'
    };
    return mapping[gradeLevel] || 'primary_upper';
  }
  
  // --------------------------------------------------------------------------
  // Validation
  // --------------------------------------------------------------------------
  
  private validateRequest(request: ImageGenerationRequest): { valid: boolean; reason?: string } {
    // Check for blocked terms in topic
    const topicLower = request.topic.toLowerCase();
    for (const term of BLOCKED_TERMS) {
      if (topicLower.includes(term)) {
        return { valid: false, reason: `Topic contains blocked term: ${term}` };
      }
    }
    
    // Check topic length
    if (request.topic.length < 3) {
      return { valid: false, reason: 'Topic too short' };
    }
    
    if (request.topic.length > 500) {
      return { valid: false, reason: 'Topic too long' };
    }
    
    return { valid: true };
  }
  
  // --------------------------------------------------------------------------
  // Caching & Storage
  // --------------------------------------------------------------------------
  
  private hashPrompt(prompt: string): string {
    return crypto.createHash('sha256').update(prompt).digest('hex').slice(0, 16);
  }
  
  private async getCachedImage(promptHash: string): Promise<VisualLibraryItem | null> {
    const { data, error } = await this.supabase
      .from('visual_library')
      .select('*')
      .eq('prompt_hash', promptHash)
      .single();
    
    if (error || !data) return null;
    
    return this.mapDbToLibraryItem(data);
  }
  
  private async cacheImage(item: Omit<VisualLibraryItem, 'id' | 'usageCount' | 'createdAt'>): Promise<VisualLibraryItem> {
    const { data, error } = await this.supabase
      .from('visual_library')
      .insert({
        prompt_hash: item.promptHash,
        category: item.category,
        subcategory: item.subcategory,
        image_url: item.imageUrl,
        thumbnail_url: item.thumbnailUrl,
        prompt: item.prompt,
        provider: item.provider,
        generation_cost: item.cost,
        grade_min: item.gradeMin,
        grade_max: item.gradeMax,
        alt_text: item.altText,
        alt_text_el: item.altTextEl,
        tags: item.tags,
        usage_count: 1
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return this.mapDbToLibraryItem(data);
  }
  
  private async incrementUsageCount(id: string): Promise<void> {
    await this.supabase.rpc('increment_visual_usage', { row_id: id });
  }
  
  private async uploadImage(
    base64Data: string,
    promptHash: string,
    subject: string
  ): Promise<{ imageUrl: string; thumbnailUrl: string }> {
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `${subject}/${promptHash}.png`;
    const thumbnailName = `${subject}/thumb_${promptHash}.png`;
    
    // Upload main image
    const { error: uploadError } = await this.supabase.storage
      .from(this.config.storageBucket)
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (uploadError) throw uploadError;
    
    // For thumbnail, we'd ideally resize the image
    // For now, use the same image (you'd want to add sharp or similar for resizing)
    const { error: thumbError } = await this.supabase.storage
      .from(this.config.storageBucket)
      .upload(thumbnailName, buffer, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (thumbError) throw thumbError;
    
    // Get public URLs
    const { data: imageData } = this.supabase.storage
      .from(this.config.storageBucket)
      .getPublicUrl(fileName);
    
    const { data: thumbData } = this.supabase.storage
      .from(this.config.storageBucket)
      .getPublicUrl(thumbnailName);
    
    return {
      imageUrl: imageData.publicUrl,
      thumbnailUrl: thumbData.publicUrl
    };
  }
  
  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------
  
  private mapDbToLibraryItem(data: any): VisualLibraryItem {
    return {
      id: data.id,
      promptHash: data.prompt_hash,
      category: data.category,
      subcategory: data.subcategory,
      imageUrl: data.image_url,
      thumbnailUrl: data.thumbnail_url,
      prompt: data.prompt,
      provider: data.provider,
      cost: parseFloat(data.generation_cost),
      gradeMin: data.grade_min,
      gradeMax: data.grade_max,
      altText: data.alt_text,
      altTextEl: data.alt_text_el,
      tags: data.tags || [],
      usageCount: data.usage_count,
      createdAt: new Date(data.created_at)
    };
  }
  
  private getGradeRangeMin(gradeLevel: GradeLevel): GradeLevel {
    const ageGroup = this.getAgeGroup(gradeLevel);
    const mapping: Record<string, GradeLevel> = {
      'primary_lower': 'a_dimotikou',
      'primary_upper': 'g_dimotikou',
      'gymnasio': 'a_gymnasiou',
      'lykeio': 'a_lykeiou'
    };
    return mapping[ageGroup] || gradeLevel;
  }
  
  private getGradeRangeMax(gradeLevel: GradeLevel): GradeLevel {
    const ageGroup = this.getAgeGroup(gradeLevel);
    const mapping: Record<string, GradeLevel> = {
      'primary_lower': 'b_dimotikou',
      'primary_upper': 'st_dimotikou',
      'gymnasio': 'g_gymnasiou',
      'lykeio': 'g_lykeiou'
    };
    return mapping[ageGroup] || gradeLevel;
  }
  
  private generateAltText(request: ImageGenerationRequest, lang: 'en' | 'el'): string {
    if (lang === 'el') {
      return `Εκπαιδευτική εικόνα για ${request.topic} - ${SUBJECT_CONTEXT[request.subject]}`;
    }
    return `Educational illustration about ${request.topic} - ${SUBJECT_CONTEXT[request.subject]}`;
  }
  
  private generateTags(request: ImageGenerationRequest): string[] {
    const tags = [
      request.subject,
      request.style,
      this.getAgeGroup(request.gradeLevel)
    ];
    
    // Add topic words as tags
    const topicWords = request.topic.toLowerCase().split(/\s+/);
    for (const word of topicWords) {
      if (word.length > 3 && !BLOCKED_TERMS.includes(word)) {
        tags.push(word);
      }
    }
    
    return [...new Set(tags)].slice(0, 10);
  }
  
  private async getGoogleAccessToken(): Promise<string> {
    // In production, use Google Cloud authentication
    // This is a placeholder - you'd use @google-cloud/aiplatform or similar
    throw new Error('Google Cloud authentication not implemented');
  }
}

// ============================================================================
// Pre-generation Script Helper
// ============================================================================

export interface PreGenerationConfig {
  items: Array<{
    subject: EnrichmentSubject;
    topic: string;
    style: ImageStyle;
    gradeLevel: GradeLevel;
    tags?: string[];
  }>;
}

/**
 * Pre-generate a library of educational images
 */
export async function preGenerateLibrary(
  service: VisualContentService,
  config: PreGenerationConfig,
  options?: {
    batchSize?: number;
    delayMs?: number;
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<GeneratedImage[]> {
  const { batchSize = 5, delayMs = 1000, onProgress } = options || {};
  const results: GeneratedImage[] = [];
  
  for (let i = 0; i < config.items.length; i += batchSize) {
    const batch = config.items.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(item => 
        service.generateImage({
          subject: item.subject,
          gradeLevel: item.gradeLevel,
          topic: item.topic,
          style: item.style
        }).catch(err => {
          console.error(`Failed to generate image for "${item.topic}":`, err);
          return null;
        })
      )
    );
    
    results.push(...batchResults.filter((r): r is GeneratedImage => r !== null));
    
    onProgress?.(Math.min(i + batchSize, config.items.length), config.items.length);
    
    // Rate limiting delay
    if (i + batchSize < config.items.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

// ============================================================================
// Sample Pre-generation Library Definition
// ============================================================================

export const SAMPLE_LIBRARY_CONFIG: PreGenerationConfig = {
  items: [
    // Philosophy - Ethical Dilemmas
    { subject: 'philosophy_logic', topic: 'Two children deciding how to share toys fairly', style: 'cartoon_friendly', gradeLevel: 'g_dimotikou' },
    { subject: 'philosophy_logic', topic: 'A child finding money on the ground and thinking what to do', style: 'cartoon_friendly', gradeLevel: 'd_dimotikou' },
    { subject: 'philosophy_logic', topic: 'Socrates teaching students under a tree', style: 'educational', gradeLevel: 'e_dimotikou' },
    { subject: 'philosophy_logic', topic: 'Plato cave allegory with shadows on wall', style: 'artistic', gradeLevel: 'a_gymnasiou' },
    
    // SEL - Emotions
    { subject: 'me_new_world', topic: 'Child feeling happy playing with friends', style: 'cartoon_friendly', gradeLevel: 'a_dimotikou' },
    { subject: 'me_new_world', topic: 'Child feeling sad and a friend comforting them', style: 'cartoon_friendly', gradeLevel: 'b_dimotikou' },
    { subject: 'me_new_world', topic: 'Deep breathing exercise with calm colors', style: 'minimal', gradeLevel: 'g_dimotikou' },
    { subject: 'me_new_world', topic: 'Recycling and caring for the environment', style: 'educational', gradeLevel: 'd_dimotikou' },
    
    // Financial
    { subject: 'financial_literacy', topic: 'Child saving coins in a piggy bank', style: 'cartoon_friendly', gradeLevel: 'a_dimotikou' },
    { subject: 'financial_literacy', topic: 'Simple lemonade stand business', style: 'cartoon_friendly', gradeLevel: 'g_dimotikou' },
    { subject: 'financial_literacy', topic: 'Stock market graph going up and down', style: 'educational', gradeLevel: 'b_gymnasiou' },
    
    // Computer Science
    { subject: 'cs_computational', topic: 'Robot following step by step instructions', style: 'cartoon_friendly', gradeLevel: 'b_dimotikou' },
    { subject: 'cs_computational', topic: 'Colorful flowchart showing algorithm', style: 'educational', gradeLevel: 'e_dimotikou' },
    { subject: 'cs_computational', topic: 'Neural network visualization', style: 'educational', gradeLevel: 'b_gymnasiou' },
    
    // Art
    { subject: 'art_creativity', topic: 'Artist palette with colorful paints', style: 'artistic', gradeLevel: 'a_dimotikou' },
    { subject: 'art_creativity', topic: 'Design thinking process diagram', style: 'educational', gradeLevel: 'e_dimotikou' },
  ]
};

// ============================================================================
// Exports
// ============================================================================

export default VisualContentService;
