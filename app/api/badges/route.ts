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

    // Get user's badges
    const { data: badges, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Badges GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
    }

    // Get all available badges for progress tracking
    const { data: allBadges } = await supabase
      .from('badges')
      .select('*')
      .order('points_required', { ascending: true });

    return NextResponse.json({
      earned: badges || [],
      available: allBadges || []
    });

  } catch (error) {
    console.error('Badges GET error:', error);
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

    const { badgeId } = await request.json();

    if (!badgeId) {
      return NextResponse.json({ error: 'Badge ID required' }, { status: 400 });
    }

    // Check if already earned
    const { data: existing } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', user.id)
      .eq('badge_id', badgeId)
      .single();

    if (existing) {
      return NextResponse.json({ message: 'Badge already earned' });
    }

    // Award badge
    const { data: newBadge, error } = await supabase
      .from('user_badges')
      .insert({
        user_id: user.id,
        badge_id: badgeId,
        earned_at: new Date().toISOString()
      })
      .select(`
        *,
        badge:badges(*)
      `)
      .single();

    if (error) {
      console.error('Badge award error:', error);
      return NextResponse.json({ error: 'Failed to award badge' }, { status: 500 });
    }

    return NextResponse.json({ badge: newBadge });

  } catch (error) {
    console.error('Badges POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
