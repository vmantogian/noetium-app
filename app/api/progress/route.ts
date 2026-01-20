import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch user's progress
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get feature filter from query params
    const { searchParams } = new URL(request.url);
    const feature = searchParams.get('feature');

    let query = supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (feature) {
      query = query.eq('feature', feature);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching progress:', error);
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }

    return NextResponse.json({ progress: data });
  } catch (error) {
    console.error('Progress GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save new progress entry
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { feature, activity_type, activity_id, score, completed, metadata } = body;

    if (!feature || !activity_type) {
      return NextResponse.json(
        { error: 'Missing required fields: feature, activity_type' },
        { status: 400 }
      );
    }

    // Insert progress entry
    const { data, error } = await supabase
      .from('user_progress')
      .insert({
        user_id: user.id,
        feature,
        activity_type,
        activity_id,
        score,
        completed: completed || false,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving progress:', error);
      return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
    }

    // Update streak if activity was completed
    if (completed) {
      await updateStreak(supabase, user.id, feature);
    }

    // Check for badges
    const newBadges = await checkAndAwardBadges(supabase, user.id, feature, activity_type);

    return NextResponse.json({ 
      progress: data,
      newBadges 
    });
  } catch (error) {
    console.error('Progress POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper: Update user streak
async function updateStreak(supabase: any, userId: string, feature: string) {
  const today = new Date().toISOString().split('T')[0];
  
  // Get current streak
  const { data: existingStreak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('streak_type', feature)
    .single();

  if (existingStreak) {
    const lastActivity = existingStreak.last_activity_date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = existingStreak.current_streak;

    if (lastActivity === yesterdayStr) {
      // Continuing streak
      newStreak += 1;
    } else if (lastActivity !== today) {
      // Streak broken, reset to 1
      newStreak = 1;
    }
    // If lastActivity === today, don't change streak

    await supabase
      .from('user_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, existingStreak.longest_streak),
        last_activity_date: today
      })
      .eq('id', existingStreak.id);
  } else {
    // Create new streak
    await supabase
      .from('user_streaks')
      .insert({
        user_id: userId,
        streak_type: feature,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today
      });
  }
}

// Helper: Check and award badges
async function checkAndAwardBadges(
  supabase: any, 
  userId: string, 
  feature: string, 
  activityType: string
): Promise<any[]> {
  const newBadges: any[] = [];

  // Get user's progress counts
  const { count: totalCount } = await supabase
    .from('user_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('feature', feature)
    .eq('completed', true);

  // Get user's existing badges
  const { data: existingBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const existingBadgeIds = new Set(existingBadges?.map((b: any) => b.badge_id) || []);

  // Get all badges for this feature
  const { data: badges } = await supabase
    .from('badge_definitions')
    .select('*')
    .eq('is_active', true);

  // Check each badge criteria
  for (const badge of badges || []) {
    if (existingBadgeIds.has(badge.id)) continue;

    const criteria = badge.criteria || {};
    let earned = false;

    // Check various criteria
    if (criteria.sessions && feature === 'mindfulness' && totalCount >= criteria.sessions) {
      earned = true;
    }
    if (criteria.debates && feature === 'debate' && totalCount >= criteria.debates) {
      earned = true;
    }
    if (criteria.exercises && feature === 'cs-ai' && totalCount >= criteria.exercises) {
      earned = true;
    }
    if (criteria.artworks && feature === 'art' && totalCount >= criteria.artworks) {
      earned = true;
    }

    // First activity badges
    if (totalCount === 1) {
      if (badge.name === 'First Breath' && feature === 'mindfulness') earned = true;
      if (badge.name === 'First Argument' && feature === 'debate') earned = true;
      if (badge.name === 'Code Starter' && feature === 'cs-ai') earned = true;
      if (badge.name === 'First Creation' && feature === 'portfolio') earned = true;
    }

    if (earned) {
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badge.id
        });

      if (!error) {
        newBadges.push(badge);
      }
    }
  }

  return newBadges;
}
