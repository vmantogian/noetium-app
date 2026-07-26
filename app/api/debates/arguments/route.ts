import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { features, featureDisabledResponse } from '@/lib/features';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get debate arguments
export async function GET(request: NextRequest) {
  if (!features.debate) return featureDisabledResponse();

  try {
    const { searchParams } = new URL(request.url);
    const debateId = searchParams.get('debateId');

    if (!debateId) {
      return NextResponse.json({ error: 'debateId required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('debate_arguments')
      .select('*')
      .eq('debate_id', debateId)
      .order('round_number')
      .order('submitted_at');

    if (error) throw error;

    return NextResponse.json({ arguments: data });
  } catch (error: any) {
    console.error('Arguments fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Submit argument
export async function POST(request: NextRequest) {
  if (!features.debate) return featureDisabledResponse();

  try {
    const body = await request.json();
    const { debateId, participantId, roundNumber, argumentType, content } = body;

    if (!debateId || !participantId || !content) {
      return NextResponse.json({ error: 'debateId, participantId, and content required' }, { status: 400 });
    }

    const wordCount = content.split(/\s+/).filter((w: string) => w.length > 0).length;

    // Insert argument
    const { data: argument, error } = await supabase
      .from('debate_arguments')
      .insert({
        debate_id: debateId,
        participant_id: participantId,
        round_number: roundNumber || 0,
        argument_type: argumentType || 'opening',
        content: content,
        word_count: wordCount
      })
      .select()
      .single();

    if (error) throw error;

    // Generate AI feedback (optional - depends on ANTHROPIC_API_KEY)
    let aiFeedback = null;
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        aiFeedback = await generateAIFeedback(content, argumentType);
        
        // Update argument with feedback
        await supabase
          .from('debate_arguments')
          .update({ ai_feedback: aiFeedback })
          .eq('id', argument.id);
        
        argument.ai_feedback = aiFeedback;
      } catch (aiError) {
        console.error('AI feedback error:', aiError);
        // Continue without AI feedback
      }
    }

    // Update debate turn for async debates
    await updateDebateTurn(debateId);

    return NextResponse.json({ success: true, argument });
  } catch (error: any) {
    console.error('Argument submit error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Generate AI feedback using Anthropic
async function generateAIFeedback(content: string, argumentType: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Ανάλυσε αυτό το ${argumentType} επιχείρημα από μαθητικό debate και δώσε σύντομο, εποικοδομητικό feedback.

ΕΠΙΧΕΙΡΗΜΑ:
${content}

Απάντησε ΜΟΝΟ σε JSON format:
{
  "structureScore": 1-5,
  "evidenceScore": 1-5,
  "clarityScore": 1-5,
  "logicScore": 1-5,
  "suggestions": ["σύντομη πρόταση 1", "σύντομη πρόταση 2"]
}

Να είσαι ενθαρρυντικός - είναι εκπαιδευτικό!`
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const responseText = data.content[0]?.text || '';
  
  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  // Default feedback if parsing fails
  return {
    structureScore: 3,
    evidenceScore: 3,
    clarityScore: 3,
    logicScore: 3,
    suggestions: ['Συνέχισε την προσπάθεια!']
  };
}

// Update whose turn it is in async debate
async function updateDebateTurn(debateId: string) {
  // Get debate info
  const { data: debate } = await supabase
    .from('debates')
    .select('*, debate_participants(*)')
    .eq('id', debateId)
    .single();

  if (!debate || !debate.is_async) return;

  // Get current arguments
  const { data: arguments_ } = await supabase
    .from('debate_arguments')
    .select('participant_id')
    .eq('debate_id', debateId);

  const argumentCount = arguments_?.length || 0;

  // Simple turn alternation
  const debaters = debate.debate_participants.filter((p: any) => p.role === 'debater');
  const affirmative = debaters.find((p: any) => p.side === 'affirmative');
  const negative = debaters.find((p: any) => p.side === 'negative');

  // Determine next turn (alternating, starting with affirmative)
  const nextParticipant = argumentCount % 2 === 0 ? affirmative : negative;

  if (nextParticipant) {
    await supabase
      .from('debates')
      .update({
        current_turn: nextParticipant.user_id,
        turn_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
      .eq('id', debateId);
  }

  // Check if debate should be completed (e.g., after 6 arguments)
  if (argumentCount >= 6) {
    await supabase
      .from('debates')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', debateId);
  }
}
