import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, style, subject, searchExisting } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Option 1: Search existing textbook images first
    if (searchExisting) {
      const existingImage = await searchTextbookImages(supabase, prompt, subject);
      if (existingImage) {
        return NextResponse.json({
          imageUrl: existingImage.url,
          source: 'textbook',
          description: existingImage.description,
          sourceTitle: existingImage.source_title
        });
      }
    }

    // Option 2: Generate new image with DALL-E 3
    const educationalPrompt = buildEducationalPrompt(prompt, style, subject);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: educationalPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: style === 'realistic' ? 'natural' : 'vivid',
    });

    const imageUrl = response.data[0]?.url;
    const revisedPrompt = response.data[0]?.revised_prompt;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
    }

    // Log usage for tracking
    try {
      await supabase.from('user_progress').insert({
        user_id: user.id,
        feature: 'image_generation',
        activity_type: 'dalle',
        metadata: { prompt, subject, style }
      });
    } catch (e) {
      console.error('Failed to log image generation:', e);
    }

    return NextResponse.json({
      imageUrl,
      source: 'generated',
      revisedPrompt,
      originalPrompt: prompt
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    
    // Handle content policy violations
    if (error?.code === 'content_policy_violation') {
      return NextResponse.json({ 
        error: 'Το αίτημα δεν μπορεί να επεξεργαστεί. Δοκίμασε διαφορετική περιγραφή.' 
      }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}

// Search existing textbook images in database
async function searchTextbookImages(
  supabase: any, 
  query: string, 
  subject?: string
): Promise<{ url: string; description: string; source_title: string } | null> {
  try {
    // Generate embedding for the query
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    
    const embedding = embeddingResponse.data[0].embedding;

    // Search for similar images in the database
    const { data, error } = await supabase.rpc('search_textbook_images', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: 1,
      filter_subject: subject || null
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    return {
      url: data[0].image_url,
      description: data[0].description,
      source_title: data[0].source_title
    };
  } catch (error) {
    console.error('Textbook image search error:', error);
    return null;
  }
}

// Build educational-focused prompt
function buildEducationalPrompt(prompt: string, style?: string, subject?: string): string {
  const subjectStyles: Record<string, string> = {
    math: 'educational diagram style, clean lines, labeled, mathematical visualization',
    physics: 'scientific illustration, physics diagram, labeled forces and vectors',
    chemistry: 'molecular visualization, chemical structure, educational chemistry diagram',
    biology: 'biological illustration, anatomical diagram, labeled parts',
    history: 'historical illustration, educational, historically accurate',
    geography: 'cartographic style, geographical illustration, educational map',
  };

  const stylePrefix = subject && subjectStyles[subject] 
    ? subjectStyles[subject] 
    : 'educational illustration, clear and simple, suitable for students';

  const safetyPrefix = 'Safe for children, educational content only.';

  return `${safetyPrefix} ${stylePrefix}. ${prompt}. No text or labels in the image unless specifically requested.`;
}
