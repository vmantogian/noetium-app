import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Style modifiers for prompts
const STYLE_MODIFIERS: Record<string, string> = {
  cartoon_friendly: 'friendly cartoon style, soft colors, rounded shapes, child-appropriate, no scary elements',
  educational: 'clean educational illustration, clear labels, simple composition, professional',
  realistic: 'photorealistic, detailed, accurate representation',
  comic_strip: '4-panel comic strip style, clear speech bubbles, expressive characters'
};

const AGE_MODIFIERS: Record<string, string> = {
  dimotiko: 'very simple, bright primary colors, cute characters, large elements, suitable for children ages 6-12',
  gymnasio: 'colorful, engaging, slightly more detailed, suitable for teens ages 12-15',
  lykeio: 'more sophisticated, mature themes handled tastefully, artistic, suitable for ages 15-18'
};

// POST - Generate image
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, gradeLevel, topic, style } = body;

    if (!topic) {
      return NextResponse.json({ error: 'topic required' }, { status: 400 });
    }

    // Build prompt
    const styleModifier = STYLE_MODIFIERS[style || 'cartoon_friendly'];
    const ageModifier = getAgeModifier(gradeLevel);
    const safetyPrefix = 'Safe for children, educational, no violence, no inappropriate content.';
    
    const fullPrompt = `${safetyPrefix} ${styleModifier}. ${ageModifier}. Topic: ${topic}`;
    
    // Check cache first
    const promptHash = crypto.createHash('md5').update(fullPrompt).digest('hex');
    
    const { data: cached } = await supabase
      .from('visual_library')
      .select('*')
      .eq('prompt_hash', promptHash)
      .single();

    if (cached) {
      // Update usage count
      await supabase
        .from('visual_library')
        .update({ usage_count: cached.usage_count + 1 })
        .eq('id', cached.id);

      return NextResponse.json({
        success: true,
        image: {
          imageUrl: cached.image_url,
          thumbnailUrl: cached.thumbnail_url,
          cached: true,
          provider: cached.provider
        }
      });
    }

    // Generate new image
    let imageResult;
    
    if (process.env.OPENAI_API_KEY) {
      imageResult = await generateWithDalle(fullPrompt);
    } else {
      return NextResponse.json({ 
        error: 'No image generation API configured. Set OPENAI_API_KEY in .env.local' 
      }, { status: 500 });
    }

    // Store in library
    const { data: stored } = await supabase
      .from('visual_library')
      .insert({
        prompt_hash: promptHash,
        category: subject || 'general',
        image_url: imageResult.imageUrl,
        thumbnail_url: imageResult.imageUrl, // Could generate thumbnail
        prompt: fullPrompt,
        provider: imageResult.provider,
        generation_cost: imageResult.cost,
        grade_min: gradeLevel,
        grade_max: gradeLevel,
        usage_count: 1
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      image: {
        imageUrl: imageResult.imageUrl,
        thumbnailUrl: imageResult.imageUrl,
        cached: false,
        provider: imageResult.provider
      }
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Search visual library
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');

    let dbQuery = supabase
      .from('visual_library')
      .select('*')
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (category) {
      dbQuery = dbQuery.eq('category', category);
    }

    if (query) {
      dbQuery = dbQuery.or(`category.ilike.%${query}%,prompt.ilike.%${query}%`);
    }

    const { data, error } = await dbQuery;

    if (error) throw error;

    return NextResponse.json({ images: data });
  } catch (error: any) {
    console.error('Image search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper to get age modifier
function getAgeModifier(gradeLevel: string): string {
  if (!gradeLevel) return AGE_MODIFIERS.dimotiko;
  
  if (gradeLevel.includes('dimotikou') || gradeLevel.includes('dimotiko')) {
    return AGE_MODIFIERS.dimotiko;
  } else if (gradeLevel.includes('gymnasiou') || gradeLevel.includes('gymnasio')) {
    return AGE_MODIFIERS.gymnasio;
  } else if (gradeLevel.includes('lykeiou') || gradeLevel.includes('lykeio')) {
    return AGE_MODIFIERS.lykeio;
  }
  
  return AGE_MODIFIERS.dimotiko;
}

// Generate image with DALL-E
async function generateWithDalle(prompt: string) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'DALL-E API error');
  }

  const data = await response.json();
  
  return {
    imageUrl: data.data[0].url,
    provider: 'dalle',
    cost: 0.04 // DALL-E 3 standard price
  };
}
