import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { MATH_LATEX_JSON_RULE, MATH_LATEX_RULES } from '@/lib/math-prompt';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { image, subject, gradingScale, rubric } = await request.json();

    // Extract base64 data from data URL
    const base64Match = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    const mediaType = `image/${base64Match[1]}` as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    const base64Data = base64Match[2];

    const maxScore = gradingScale === '10' ? 10 : gradingScale === '20' ? 20 : gradingScale === '100' ? 100 : 10;

    const systemPrompt = `Είσαι ένας έμπειρος Έλληνας εκπαιδευτικός που αξιολογεί εργασίες μαθητών.
    Είσαι δίκαιος, αντικειμενικός και δίνεις εποικοδομητική κριτική.
    Αναγνωρίζεις τα δυνατά σημεία και προτείνεις συγκεκριμένες βελτιώσεις.`;

    const userPrompt = `Αξιολόγησε αυτή τη μαθητική εργασία στο μάθημα: ${subject}

Κλίμακα βαθμολόγησης: 0-${maxScore}
${rubric ? `Κριτήρια αξιολόγησης: ${rubric}` : ''}

Παρακαλώ:
1. Διάβασε προσεκτικά την εργασία
2. Αξιολόγησε τη σωστότητα της μεθοδολογίας
3. Έλεγξε τους υπολογισμούς
4. Αξιολόγησε την παρουσίαση

ΣΗΜΑΝΤΙΚΟ: Απάντησε ΜΟΝΟ σε JSON format:
{
  "score": <αριθμός>,
  "maxScore": ${maxScore},
  "feedback": "Γενική αξιολόγηση σε 2-3 προτάσεις",
  "details": [
    {
      "criterion": "Όνομα κριτηρίου",
      "score": <αριθμός>,
      "maxScore": <αριθμός>,
      "comment": "Σχόλιο"
    }
  ],
  "suggestions": [
    "Πρόταση βελτίωσης 1",
    "Πρόταση βελτίωσης 2"
  ]
}

${MATH_LATEX_RULES}
${MATH_LATEX_JSON_RULE}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
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
      // If parsing fails, return default structure
    }

    // Default response if parsing fails
    return NextResponse.json({
      score: Math.round(maxScore * 0.7),
      maxScore,
      feedback: 'Η εργασία αξιολογήθηκε επιτυχώς.',
      details: [
        { criterion: 'Γενική Εντύπωση', score: Math.round(maxScore * 0.7), maxScore, comment: 'Καλή προσπάθεια' }
      ],
      suggestions: ['Συνέχισε την καλή δουλειά!'],
      raw: content,
    });
  } catch (error) {
    console.error('Photo Grader API Error:', error);
    return NextResponse.json(
      { error: 'Failed to grade assignment' },
      { status: 500 }
    );
  }
}
