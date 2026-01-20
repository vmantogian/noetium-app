import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get user's portfolio with all related data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Get portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('student_id', userId)
      .single();

    if (portfolioError && portfolioError.code !== 'PGRST116') throw portfolioError;

    if (!portfolio) {
      return NextResponse.json({ portfolio: null });
    }

    // Get artifacts with files and self-assessments
    const { data: artifacts } = await supabase
      .from('artifacts')
      .select('*, artifact_files(*), self_assessments(*)')
      .eq('portfolio_id', portfolio.id)
      .order('created_at', { ascending: false });

    // Get badges earned
    const { data: badgesEarned } = await supabase
      .from('badges_earned')
      .select('*, badge_definitions(*)')
      .eq('student_id', userId);

    // Get learning goals
    const { data: goals } = await supabase
      .from('learning_goals')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .order('created_at', { ascending: false });

    // Calculate stats
    const stats = {
      totalArtifacts: artifacts?.length || 0,
      bySubject: (artifacts || []).reduce((acc: Record<string, number>, a: any) => {
        acc[a.subject] = (acc[a.subject] || 0) + 1;
        return acc;
      }, {}),
      badgesEarned: badgesEarned?.length || 0,
      goalsActive: goals?.filter((g: any) => g.status === 'in_progress').length || 0,
      goalsAchieved: goals?.filter((g: any) => g.status === 'achieved').length || 0,
      lastActivity: portfolio.updated_at
    };

    // Format badges
    const badges = (badgesEarned || []).map((b: any) => ({
      ...b.badge_definitions,
      earnedAt: b.earned_at
    }));

    return NextResponse.json({
      portfolio: {
        ...portfolio,
        artifacts: artifacts || [],
        badges,
        goals: goals || [],
        stats
      }
    });
  } catch (error: any) {
    console.error('Portfolio fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new portfolio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, gradeLevel, visibility } = body;

    // Check if portfolio already exists
    const { data: existing } = await supabase
      .from('portfolios')
      .select('id')
      .eq('student_id', userId)
      .single();

    if (existing) {
      return NextResponse.json({ success: false, message: 'Portfolio already exists', portfolioId: existing.id });
    }

    const { data, error } = await supabase
      .from('portfolios')
      .insert({
        student_id: userId,
        grade_level: gradeLevel,
        visibility: visibility || 'private'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, portfolio: data });
  } catch (error: any) {
    console.error('Portfolio create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
