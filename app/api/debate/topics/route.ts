import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch debate topics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const complexity = searchParams.get('complexity');

    let query = supabase
      .from('debate_topics')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }
    if (complexity) {
      query = query.eq('complexity', complexity);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching topics:', error);
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
    }

    return NextResponse.json({ topics: data });
  } catch (error) {
    console.error('Topics GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
