import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { features, featureDisabledResponse } from '@/lib/features';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get debate topics
export async function GET(request: NextRequest) {
  if (!features.debate) return featureDisabledResponse();

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const complexity = searchParams.get('complexity');
    const search = searchParams.get('search');
    const topicId = searchParams.get('topicId');

    // Get single topic
    if (topicId) {
      const { data, error } = await supabase
        .from('debate_topics')
        .select('*')
        .eq('id', topicId)
        .single();

      if (error) throw error;

      return NextResponse.json({ topic: data });
    }

    // Get all topics with filters
    let query = supabase
      .from('debate_topics')
      .select('*')
      .eq('is_active', true)
      .order('usage_count', { ascending: false });

    if (category) query = query.eq('category', category);
    if (complexity) query = query.eq('complexity', complexity);
    if (search) {
      query = query.or(`topic.ilike.%${search}%,topic_el.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ topics: data });
  } catch (error: any) {
    console.error('Topics fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new topic (admin only)
export async function POST(request: NextRequest) {
  if (!features.debate) return featureDisabledResponse();

  try {
    const body = await request.json();
    const { 
      topic, 
      topicEl, 
      category, 
      complexity, 
      gradeMin, 
      gradeMax,
      backgroundInfo,
      backgroundInfoEl,
      affirmativePoints,
      negativePoints 
    } = body;

    if (!topic || !topicEl || !category) {
      return NextResponse.json({ error: 'topic, topicEl, and category required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('debate_topics')
      .insert({
        topic,
        topic_el: topicEl,
        category,
        complexity: complexity || 'moderate',
        grade_min: gradeMin || 'e_dimotikou',
        grade_max: gradeMax || 'g_lykeiou',
        background_info: backgroundInfo,
        background_info_el: backgroundInfoEl,
        affirmative_points: affirmativePoints || [],
        negative_points: negativePoints || [],
        is_active: true,
        usage_count: 0
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, topic: data });
  } catch (error: any) {
    console.error('Topic create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
