import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { argument, difficulty, topic } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      // Return mock feedback if no API key
      return NextResponse.json({
        feedback: {
          overallScore: 7,
          strengths: ['Καλή προσπάθεια!'],
          improvements: ['Δοκίμασε να προσθέσεις συγκεκριμένα παραδείγματα'],
          tip: 'Συνέχισε έτσι!'
        }
      });
    }

    const prompt = `Είσαι εκπαιδευτικός που αξιολογεί επιχειρήματα μαθητών σε debate.

ΘΕΜΑ: ${topic}
ΔΥΣΚΟΛΙΑ: ${difficulty}

ΕΠΙΧΕΙΡΗΜΑ ΜΑΘΗΤΗ:
${argument}

Αξιολόγησε το επιχείρημα και δώσε ΣΥΝΤΟΜΟ, ΕΠΟΙΚΟΔΟΜΗΤΙΚΟ feedback.
Να είσαι ενθαρρυντικός - αυτό είναι εκπαιδευτικό!

Απάντησε ΜΟΝΟ σε JSON format (χωρίς markdown):
{
  "overallScore": <1-10>,
  "strengths": ["<1 δυνατό σημείο στα ελληνικά>"],
  "improvements": ["<1 πρόταση βελτίωσης στα ελληνικά>"],
  "tip": "<μικρή συμβουλή στα ελληνικά>"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.content[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const feedback = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ feedback });
    }

    // Default feedback if parsing fails
    return NextResponse.json({
      feedback: {
        overallScore: 6,
        strengths: ['Καλή προσπάθεια!'],
        improvements: ['Συνέχισε να εξασκείσαι'],
        tip: null
      }
    });
  } catch (error: any) {
    console.error('Feedback error:', error);
    return NextResponse.json({
      feedback: {
        overallScore: 5,
        strengths: ['Καλή προσπάθεια!'],
        improvements: ['Συνέχισε να εξασκείσαι'],
        tip: null
      }
    });
  }
}
