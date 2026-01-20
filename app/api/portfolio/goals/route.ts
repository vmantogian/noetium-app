import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get user's goals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');
    const status = searchParams.get('status');

    if (!portfolioId) {
      return NextResponse.json({ error: 'portfolioId required' }, { status: 400 });
    }

    let query = supabase
      .from('learning_goals')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ goals: data });
  } catch (error: any) {
    console.error('Goals fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new goal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portfolioId, title, titleEl, description, subject, targetDate } = body;

    if (!portfolioId || !title) {
      return NextResponse.json({ error: 'portfolioId and title required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('learning_goals')
      .insert({
        portfolio_id: portfolioId,
        title: title,
        title_el: titleEl,
        description: description,
        subject: subject,
        target_date: targetDate,
        progress: 0,
        status: 'in_progress'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, goal: data });
  } catch (error: any) {
    console.error('Goal create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update goal progress/status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { goalId, progress, status, reflection } = body;

    if (!goalId) {
      return NextResponse.json({ error: 'goalId required' }, { status: 400 });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    
    if (progress !== undefined) updates.progress = progress;
    if (reflection !== undefined) updates.reflection = reflection;
    
    if (status !== undefined) {
      updates.status = status;
      if (status === 'achieved') {
        updates.completed_at = new Date().toISOString();
        updates.progress = 100;
      }
    }

    const { data, error } = await supabase
      .from('learning_goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, goal: data });
  } catch (error: any) {
    console.error('Goal update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete goal
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('goalId');

    if (!goalId) {
      return NextResponse.json({ error: 'goalId required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('learning_goals')
      .delete()
      .eq('id', goalId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Goal delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
