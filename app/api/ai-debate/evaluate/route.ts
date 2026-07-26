import { NextRequest, NextResponse } from 'next/server';
import { features, featureDisabledResponse } from '@/lib/features';

export async function POST(request: NextRequest) {
  if (!features.debate) return featureDisabledResponse();

  try {
    const body = await request.json();
    const { config, messages, difficulty } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      // Return mock evaluation if no API key
      return NextResponse.json({
        result: {
          winner: 'user',
          userScore: 7,
          aiScore: 6,
          summary: 'Great debate! You presented strong arguments.',
          summaryEl: 'Εξαιρετικό debate! Παρουσίασες δυνατά επιχειρήματα.',
          skillsImproved: ['Λογική σκέψη', 'Επιχειρηματολογία'],
          badges: []
        }
      });
    }

    // Build conversation for evaluation
    const conversationText = messages.map((m: any) => 
      `${m.role === 'user' ? 'ΜΑΘΗΤΗΣ' : 'AI'} (${m.type}): ${m.content}`
    ).join('\n\n');

    const prompt = `Είσαι κριτής debate που αξιολογεί μια ολοκληρωμένη συζήτηση μεταξύ μαθητή και AI.

ΘΕΜΑ: ${config.topicEl || config.topic}
ΠΛΕΥΡΑ ΜΑΘΗΤΗ: ${config.userSide === 'affirmative' ? 'Υπέρ' : 'Κατά'}
ΔΥΣΚΟΛΙΑ AI: ${difficulty}

ΣΥΖΗΤΗΣΗ:
${conversationText}

Αξιολόγησε τη συζήτηση δίκαια. Σκέψου:
- Ποιότητα επιχειρημάτων
- Χρήση αποδείξεων
- Λογική συνέπεια
- Αντιμετώπιση αντεπιχειρημάτων
- Ρητορική δεινότητα

Για δυσκολία "${difficulty}", προσάρμοσε τις προσδοκίες:
- easy: Ο μαθητής πρέπει να κερδίζει συχνά (70%)
- medium: 50-50 πιθανότητες
- hard: Ο μαθητής κερδίζει 30%
- expert: Ο μαθητής κερδίζει 15-20%

Απάντησε ΜΟΝΟ σε JSON (χωρίς markdown):
{
  "winner": "user" ή "ai" ή "tie",
  "userScore": <1-10>,
  "aiScore": <1-10>,
  "summary": "<2 προτάσεις σύνοψης στα αγγλικά>",
  "summaryEl": "<2 προτάσεις σύνοψης στα ελληνικά>",
  "skillsImproved": ["<δεξιότητα 1>", "<δεξιότητα 2>"]
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
        max_tokens: 500,
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
      const result = JSON.parse(jsonMatch[0]);
      result.badges = []; // Will be populated by badge service
      return NextResponse.json({ result });
    }

    // Default result if parsing fails
    return NextResponse.json({
      result: {
        winner: 'tie',
        userScore: 6,
        aiScore: 6,
        summary: 'A competitive debate with good arguments on both sides.',
        summaryEl: 'Ένα ανταγωνιστικό debate με καλά επιχειρήματα και από τις δύο πλευρές.',
        skillsImproved: ['Κριτική σκέψη'],
        badges: []
      }
    });
  } catch (error: any) {
    console.error('Evaluation error:', error);
    return NextResponse.json({
      result: {
        winner: 'tie',
        userScore: 5,
        aiScore: 5,
        summary: 'Debate completed.',
        summaryEl: 'Το debate ολοκληρώθηκε.',
        skillsImproved: [],
        badges: []
      }
    });
  }
}
