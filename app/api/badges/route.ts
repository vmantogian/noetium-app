import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch all badges and user's earned badges
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all badge definitions
    const { data: allBadges, error: badgesError } = await supabase
      .from('badge_definitions')
      .select('*')
      .eq('is_active', true)
      .order('rarity', { ascending: true });

    if (badgesError) {
      console.error('Error fetching badges:', badgesError);
      return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
    }

    // Get user's earned badges
    const { data: earnedBadges, error: earnedError } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at')
      .eq('user_id', user.id);

    if (earnedError) {
      console.error('Error fetching earned badges:', earnedError);
      return NextResponse.json({ error: 'Failed to fetch earned badges' }, { status: 500 });
    }

    // Create a map of earned badges
    const earnedMap = new Map(
      earnedBadges?.map((b: any) => [b.badge_id, b.earned_at]) || []
    );

    // Combine all badges with earned status
    const badges = allBadges?.map((badge: any) => ({
      ...badge,
      earned: earnedMap.has(badge.id),
      earnedAt: earnedMap.get(badge.id) || null
    })) || [];

    return NextResponse.json({ 
      badges,
      earnedCount: earnedBadges?.length || 0,
      totalCount: allBadges?.length || 0
    });
  } catch (error) {
    console.error('Badges GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
