import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch user's overall stats for dashboard
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total completed activities
    const { count: totalActivities } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('completed', true);

    // Get today's activities
    const today = new Date().toISOString().split('T')[0];
    const { count: todayActivities } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('created_at', today);

    // Get badges count
    const { count: badgesCount } = await supabase
      .from('user_badges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get current streak (use general or highest)
    const { data: streaks } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id);

    const currentStreak = streaks?.reduce((max, s) => Math.max(max, s.current_streak), 0) || 0;
    const longestStreak = streaks?.reduce((max, s) => Math.max(max, s.longest_streak), 0) || 0;

    // Get activity counts by feature
    const { data: progressByFeature } = await supabase
      .from('user_progress')
      .select('feature')
      .eq('user_id', user.id)
      .eq('completed', true);

    const featureCounts: Record<string, number> = {};
    progressByFeature?.forEach((p: any) => {
      featureCounts[p.feature] = (featureCounts[p.feature] || 0) + 1;
    });

    // Get recent badges
    const { data: recentBadges } = await supabase
      .from('user_badges')
      .select(`
        earned_at,
        badge_definitions (
          id,
          name,
          name_el,
          icon,
          rarity
        )
      `)
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      stats: {
        totalActivities: totalActivities || 0,
        todayActivities: todayActivities || 0,
        badgesCount: badgesCount || 0,
        currentStreak,
        longestStreak,
        featureCounts,
      },
      recentBadges: recentBadges?.map((b: any) => ({
        ...b.badge_definitions,
        earnedAt: b.earned_at
      })) || []
    });
  } catch (error) {
    console.error('Stats GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
