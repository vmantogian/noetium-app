import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { grade, subject, exerciseType, count, difficulty, customPrompt } = await request.json();

    const systemPrompt = `Είσαι ένας έμπειρος Έλληνας εκπαιδευτικός που δημιουργεί ασκήσεις για μαθητές.
    Δημιουργείς παραμετρικές ασκήσεις με σαφείς εκφωνήσεις και σωστές απαντήσεις.
    Οι ασκήσεις πρέπει να είναι κατάλληλες για το επίπεδο της τάξης.`;

    const difficultyGuide = difficulty === 'easy' 
      ? 'Οι ασκήσεις πρέπει να είναι εύκολες, με απλούς αριθμούς και άμεση επίλυση.'
      : difficulty === 'hard'
      ? 'Οι ασκήσεις πρέπει να είναι δύσκολες, με πολλαπλά βήματα και πιο σύνθετους αριθμούς.'
      : 'Οι ασκήσεις πρέπει να είναι μεσαίας δυσκολίας.';

    const userPrompt = `Δημιούργησε ${count} ασκήσεις για:

**Τάξη:** ${grade}
**Μάθημα:** ${subject}
**Τύπος:** ${exerciseType || 'Γενικές ασκήσεις'}
**Δυσκολία:** ${difficulty === 'mixed' ? 'Μεικτή (κάποιες εύκολες, κάποιες μέτριες, κάποιες δύσκολες)' : difficulty}
${customPrompt ? `**Ειδικές Οδηγίες:** ${customPrompt}` : ''}

${difficultyGuide}

Για κάθε άσκηση, δώσε:
1. Την εκφώνηση
2. Τη σωστή απάντηση
3. Το επίπεδο δυσκολίας (easy/medium/hard)

ΣΗΜΑΝΤΙΚΟ: Απάντησε ΜΟΝΟ σε JSON format χωρίς άλλο κείμενο:
{
  "exercises": [
    {
      "id": "1",
      "question": "Εκφώνηση...",
      "answer": "Απάντηση...",
      "difficulty": "easy|medium|hard",
      "hint": "Υπόδειξη (προαιρετικό)"
    }
  ]
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt,
    });

    const content = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    // Parse JSON response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
    } catch {
      // If parsing fails, return raw content
    }

    return NextResponse.json({ exercises: [], raw: content });
  } catch (error) {
    console.error('Exercise Generator API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate exercises' },
      { status: 500 }
    );
  }
}
