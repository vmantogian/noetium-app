import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Record a completed session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, exerciseId, exerciseType, durationSeconds, completed, feedbackRating, notes } = body;

    const { data, error } = await supabase
      .from('mindfulness_sessions')
      .insert({
        user_id: userId,
        exercise_id: exerciseId,
        exercise_type: exerciseType,
        duration_seconds: durationSeconds,
        completed: completed ?? true,
        feedback_rating: feedbackRating,
        notes: notes
      })
      .select()
      .single();

    if (error) throw error;

    // Update progress/streak
    await updateMindfulnessProgress(userId, durationSeconds);

    return NextResponse.json({ success: true, session: data });
  } catch (error: any) {
    console.error('Session save error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Get user's session history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('mindfulness_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ sessions: data });
  } catch (error: any) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to update progress
async function updateMindfulnessProgress(userId: string, durationSeconds: number) {
  const today = new Date().toISOString().split('T')[0];
  
  // Get existing progress
  const { data: existing } = await supabase
    .from('mindfulness_progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) {
    const lastPracticeDate = existing.last_practice?.split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let newStreak = existing.current_streak;
    if (lastPracticeDate === yesterday) {
      newStreak += 1; // Continue streak
    } else if (lastPracticeDate !== today) {
      newStreak = 1; // Reset streak
    }
    // If lastPracticeDate === today, keep same streak

    await supabase
      .from('mindfulness_progress')
      .update({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, existing.longest_streak),
        total_minutes: existing.total_minutes + Math.round(durationSeconds / 60),
        total_sessions: existing.total_sessions + 1,
        last_practice: new Date().toISOString()
      })
      .eq('user_id', userId);
  } else {
    // Create new progress record
    await supabase
      .from('mindfulness_progress')
      .insert({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        total_minutes: Math.round(durationSeconds / 60),
        total_sessions: 1,
        last_practice: new Date().toISOString()
      });
  }
}
