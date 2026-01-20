import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get user's mindfulness progress
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('mindfulness_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

    // Return defaults if no progress exists yet
    const progress = data || {
      current_streak: 0,
      longest_streak: 0,
      total_minutes: 0,
      total_sessions: 0,
      last_practice: null,
      exercise_stats: {}
    };

    return NextResponse.json({ progress });
  } catch (error: any) {
    console.error('Progress fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
