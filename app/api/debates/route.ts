import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get user's debates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const debateId = searchParams.get('debateId');

    // Get single debate by ID
    if (debateId) {
      const { data: debate, error } = await supabase
        .from('debates')
        .select('*, debate_topics(*)')
        .eq('id', debateId)
        .single();

      if (error) throw error;

      // Get participants
      const { data: participants } = await supabase
        .from('debate_participants')
        .select('*')
        .eq('debate_id', debateId);

      return NextResponse.json({ 
        debate: {
          ...debate,
          topic: debate.debate_topics,
          participants: participants || []
        }
      });
    }

    // Get all user's debates
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Get debate IDs where user is participant
    const { data: participations } = await supabase
      .from('debate_participants')
      .select('debate_id')
      .eq('user_id', userId);

    if (!participations?.length) {
      return NextResponse.json({ debates: [] });
    }

    const debateIds = participations.map(p => p.debate_id);

    let query = supabase
      .from('debates')
      .select('*, debate_topics(*)')
      .in('id', debateIds)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data: debates, error } = await query;

    if (error) throw error;

    // Get all participants for these debates
    const { data: allParticipants } = await supabase
      .from('debate_participants')
      .select('*')
      .in('debate_id', debateIds);

    // Attach participants to each debate
    const debatesWithParticipants = (debates || []).map((d: any) => ({
      ...d,
      topic: d.debate_topics,
      participants: (allParticipants || []).filter((p: any) => p.debate_id === d.id)
    }));

    return NextResponse.json({ debates: debatesWithParticipants });
  } catch (error: any) {
    console.error('Debates fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new debate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicId, format, createdBy, scheduledAt, classId } = body;

    if (!topicId || !format || !createdBy) {
      return NextResponse.json({ error: 'topicId, format, and createdBy required' }, { status: 400 });
    }

    const isAsync = format === 'written_exchange';

    const { data: debate, error } = await supabase
      .from('debates')
      .insert({
        topic_id: topicId,
        format: format,
        status: 'scheduled',
        is_async: isAsync,
        scheduled_at: scheduledAt,
        created_by: createdBy,
        class_id: classId
      })
      .select('*, debate_topics(*)')
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      debate: {
        ...debate,
        topic: debate.debate_topics,
        participants: []
      }
    });
  } catch (error: any) {
    console.error('Debate create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update debate status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { debateId, status, winnerId } = body;

    if (!debateId) {
      return NextResponse.json({ error: 'debateId required' }, { status: 400 });
    }

    const updates: any = {};
    
    if (status) {
      updates.status = status;
      if (status === 'in_progress') updates.started_at = new Date().toISOString();
      if (status === 'completed') updates.completed_at = new Date().toISOString();
    }
    
    if (winnerId) updates.winner_participant_id = winnerId;

    const { data, error } = await supabase
      .from('debates')
      .update(updates)
      .eq('id', debateId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, debate: data });
  } catch (error: any) {
    console.error('Debate update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
