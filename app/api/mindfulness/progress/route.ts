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

    // Get mindfulness progress
    const { data: progress, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('feature', 'mindfulness')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Progress fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }

    // Calculate streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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

    // Get total sessions
    const totalSessions = progress?.length || 0;
    
    // Get total minutes
    const totalMinutes = progress?.reduce((sum, p) => {
      return sum + (p.metadata?.duration_minutes || 0);
    }, 0) || 0;

    return NextResponse.json({
      progress: progress || [],
      stats: {
        streak,
        totalSessions,
        totalMinutes
      }
    });

  } catch (error) {
    console.error('Progress fetch error:', error);
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

    const { activityType, activityId, durationMinutes, mood, notes } = await request.json();

    const { data: newProgress, error } = await supabase
      .from('user_progress')
      .insert({
        user_id: user.id,
        feature: 'mindfulness',
        activity_type: activityType || 'session',
        activity_id: activityId,
        completed: true,
        metadata: {
          duration_minutes: durationMinutes,
          mood,
          notes
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Progress save error:', error);
      return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
    }

    return NextResponse.json({ progress: newProgress });

  } catch (error) {
    console.error('Progress POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
