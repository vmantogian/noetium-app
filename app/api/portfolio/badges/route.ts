import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get all badge definitions or user's earned badges
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const subject = searchParams.get('subject');

    if (userId) {
      // Get user's earned badges
      const { data, error } = await supabase
        .from('badges_earned')
        .select('*, badge_definitions(*)')
        .eq('student_id', userId);

      if (error) throw error;

      const badges = (data || []).map((b: any) => ({
        ...b.badge_definitions,
        earnedAt: b.earned_at
      }));

      return NextResponse.json({ badges });
    } else {
      // Get all badge definitions
      let query = supabase
        .from('badge_definitions')
        .select('*')
        .eq('is_active', true);

      if (category) query = query.eq('category', category);
      if (subject) query = query.eq('subject', subject);

      const { data, error } = await query;

      if (error) throw error;

      return NextResponse.json({ badges: data });
    }
  } catch (error: any) {
    console.error('Badges fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Award badge to user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, badgeId } = body;

    if (!userId || !badgeId) {
      return NextResponse.json({ error: 'userId and badgeId required' }, { status: 400 });
    }

    // Check if already earned
    const { data: existing } = await supabase
      .from('badges_earned')
      .select('id')
      .eq('student_id', userId)
      .eq('badge_id', badgeId)
      .single();

    if (existing) {
      return NextResponse.json({ success: false, message: 'Badge already earned' });
    }

    // Award the badge
    const { data, error } = await supabase
      .from('badges_earned')
      .insert({
        student_id: userId,
        badge_id: badgeId
      })
      .select('*, badge_definitions(*)')
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      badge: {
        ...data.badge_definitions,
        earnedAt: data.earned_at
      }
    });
  } catch (error: any) {
    console.error('Badge award error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
