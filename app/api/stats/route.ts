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

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get all progress entries
    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Get badges count
    const { count: badgesCount } = await supabase
      .from('user_badges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Calculate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Calculate streak
    let streak = 0;
    if (progress && progress.length > 0) {
      const dates = progress.map(p => {
        const d = new Date(p.created_at);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      });
      
      const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);
      
      for (let i = 0; i < uniqueDates.length; i++) {
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        expectedDate.setHours(0, 0, 0, 0);
        
        if (uniqueDates[i] === expectedDate.getTime()) {
          streak++;
        } else {
          break;
        }
      }
    }

    // Activity breakdown by feature
    const activityByFeature: Record<string, number> = {};
    progress?.forEach(p => {
      activityByFeature[p.feature] = (activityByFeature[p.feature] || 0) + 1;
    });

    // Weekly activity
    const weeklyActivity = progress?.filter(p => 
      new Date(p.created_at) >= thisWeekStart
    ).length || 0;

    // Monthly activity
    const monthlyActivity = progress?.filter(p => 
      new Date(p.created_at) >= thisMonthStart
    ).length || 0;

    // Total points (estimate based on activities)
    const totalPoints = (progress?.length || 0) * 10 + (badgesCount || 0) * 50;

    return NextResponse.json({
      profile: profile || {},
      stats: {
        totalActivities: progress?.length || 0,
        weeklyActivity,
        monthlyActivity,
        streak,
        badgesEarned: badgesCount || 0,
        totalPoints,
        activityByFeature
      }
    });

  } catch (error) {
    console.error('Stats GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
