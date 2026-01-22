import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile for grade level
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('grade_level')
      .eq('user_id', user.id)
      .single();

    // Get debate topics appropriate for user's level
    const { data: topics, error } = await supabase
      .from('debate_topics')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Topics GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
    }

    return NextResponse.json({
      topics: topics || [],
      userGrade: profile?.grade_level
    });

  } catch (error) {
    console.error('Topics GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, description, category, gradeLevel } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const { data: newTopic, error } = await supabase
      .from('debate_topics')
      .insert({
        topic,
        description,
        category,
        grade_level: gradeLevel,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Topic create error:', error);
      return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 });
    }

    return NextResponse.json({ topic: newTopic });

  } catch (error) {
    console.error('Topics POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
