import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Record emotion check-in
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      primaryEmotion, 
      intensity, 
      secondaryEmotion, 
      bodyLocations, 
      trigger, 
      notes 
    } = body;

    const { data, error } = await supabase
      .from('emotion_checkins')
      .insert({
        user_id: userId,
        primary_emotion: primaryEmotion,
        intensity: intensity,
        secondary_emotion: secondaryEmotion,
        body_locations: bodyLocations || [],
        trigger: trigger,
        notes: notes
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, checkin: data });
  } catch (error: any) {
    console.error('Emotion checkin error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Get user's emotion history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '30');
    const days = parseInt(searchParams.get('days') || '7');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('emotion_checkins')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Calculate emotion stats
    const stats = calculateEmotionStats(data || []);

    return NextResponse.json({ checkins: data, stats });
  } catch (error: any) {
    console.error('Emotion fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function calculateEmotionStats(checkins: any[]) {
  if (checkins.length === 0) return null;

  const emotionCounts: Record<string, number> = {};
  let totalIntensity = 0;

  for (const checkin of checkins) {
    emotionCounts[checkin.primary_emotion] = (emotionCounts[checkin.primary_emotion] || 0) + 1;
    totalIntensity += checkin.intensity || 5;
  }

  const mostFrequent = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])[0];

  return {
    totalCheckins: checkins.length,
    mostFrequentEmotion: mostFrequent?.[0],
    mostFrequentCount: mostFrequent?.[1],
    averageIntensity: Math.round(totalIntensity / checkins.length),
    emotionDistribution: emotionCounts
  };
}
