import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Request match or join debate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, topicId, preferredFormat, preferredSide, gradeLevel } = body;

    if (!userId || !gradeLevel) {
      return NextResponse.json({ error: 'userId and gradeLevel required' }, { status: 400 });
    }

    // Try to find existing match in queue
    const { data: matches } = await supabase
      .from('debate_match_queue')
      .select('*')
      .eq('status', 'waiting')
      .eq('grade_level', gradeLevel)
      .neq('user_id', userId)
      .limit(10);

    if (matches && matches.length > 0) {
      // Find best match
      let bestMatch = matches[0];
      
      // Prefer compatible format
      if (preferredFormat) {
        const formatMatch = matches.find(m => 
          m.preferred_format === preferredFormat || !m.preferred_format
        );
        if (formatMatch) bestMatch = formatMatch;
      }

      // Determine sides
      let userSide: 'affirmative' | 'negative';
      let matchSide: 'affirmative' | 'negative';

      if (preferredSide === 'affirmative') {
        userSide = 'affirmative';
        matchSide = 'negative';
      } else if (preferredSide === 'negative') {
        userSide = 'negative';
        matchSide = 'affirmative';
      } else if (bestMatch.preferred_side === 'affirmative') {
        userSide = 'negative';
        matchSide = 'affirmative';
      } else if (bestMatch.preferred_side === 'negative') {
        userSide = 'affirmative';
        matchSide = 'negative';
      } else {
        // Random assignment
        userSide = Math.random() > 0.5 ? 'affirmative' : 'negative';
        matchSide = userSide === 'affirmative' ? 'negative' : 'affirmative';
      }

      // Determine format and topic
      const format = preferredFormat || bestMatch.preferred_format || 'mini_debate';
      const finalTopicId = topicId || bestMatch.topic_id;

      // Get a random topic if none specified
      let debateTopicId = finalTopicId;
      if (!debateTopicId) {
        const { data: randomTopic } = await supabase
          .from('debate_topics')
          .select('id')
          .eq('is_active', true)
          .limit(1)
          .single();
        debateTopicId = randomTopic?.id;
      }

      if (!debateTopicId) {
        return NextResponse.json({ error: 'No topics available' }, { status: 400 });
      }

      // Create debate
      const { data: debate, error: debateError } = await supabase
        .from('debates')
        .insert({
          topic_id: debateTopicId,
          format: format,
          status: 'scheduled',
          is_async: format === 'written_exchange',
          created_by: userId
        })
        .select()
        .single();

      if (debateError) throw debateError;

      // Add both participants
      const { error: participantError } = await supabase
        .from('debate_participants')
        .insert([
          { debate_id: debate.id, user_id: userId, side: userSide, role: 'debater', is_ready: false },
          { debate_id: debate.id, user_id: bestMatch.user_id, side: matchSide, role: 'debater', is_ready: false }
        ]);

      if (participantError) throw participantError;

      // Update queue entry
      await supabase
        .from('debate_match_queue')
        .update({ status: 'matched', matched_debate_id: debate.id })
        .eq('id', bestMatch.id);

      // Increment topic usage
      await supabase.rpc('increment_topic_usage', { topic_id: debateTopicId });

      return NextResponse.json({
        matched: true,
        debateId: debate.id,
        opponent: { userId: bestMatch.user_id },
        yourSide: userSide,
        message: 'Βρέθηκε αντίπαλος! Το debate σου δημιουργήθηκε.'
      });
    }

    // No match found - add to queue
    const { error: queueError } = await supabase
      .from('debate_match_queue')
      .insert({
        user_id: userId,
        topic_id: topicId,
        preferred_format: preferredFormat,
        preferred_side: preferredSide || 'any',
        grade_level: gradeLevel,
        status: 'waiting'
      });

    if (queueError) throw queueError;

    return NextResponse.json({
      matched: false,
      message: 'Προστέθηκες στην ουρά αναμονής. Θα σε ειδοποιήσουμε όταν βρεθεί αντίπαλος!'
    });
  } catch (error: any) {
    console.error('Match error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Cancel match request
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    await supabase
      .from('debate_match_queue')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'waiting');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cancel match error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
