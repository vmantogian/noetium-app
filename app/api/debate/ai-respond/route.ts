import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      topic, 
      userSide, 
      difficulty, 
      userArgument, 
      round, 
      totalRounds,
      previousMessages 
    } = await request.json();

    if (!topic || !userArgument) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const aiSide = userSide === 'affirmative' ? 'negative' : 'affirmative';
    const aiSideGreek = aiSide === 'affirmative' ? 'ΥΠΕΡ' : 'ΚΑΤΑ';
    const userSideGreek = userSide === 'affirmative' ? 'ΥΠΕΡ' : 'ΚΑΤΑ';

    // Difficulty settings
    const difficultySettings: Record<Difficulty, { strength: string; feedback: string }> = {
      beginner: {
        strength: 'Κάνε απλά επιχειρήματα, άσε κάποια κενά στη λογική σου που ο μαθητής μπορεί να εκμεταλλευτεί. Να είσαι ενθαρρυντικός.',
        feedback: 'Δώσε πολύ θετικό feedback και συγκεκριμένες συμβουλές για βελτίωση.'
      },
      intermediate: {
        strength: 'Κάνε ισορροπημένα επιχειρήματα, μέτριας δυσκολίας.',
        feedback: 'Δώσε εποικοδομητικό feedback με θετικά και αρνητικά.'
      },
      advanced: {
        strength: 'Κάνε ισχυρά επιχειρήματα, χρησιμοποίησε λογικές τεχνικές και αντεπιχειρήματα.',
        feedback: 'Να είσαι αυστηρός στην αξιολόγηση.'
      },
      expert: {
        strength: 'Κάνε εξαιρετικά ισχυρά επιχειρήματα, χρησιμοποίησε ρητορικές τεχνικές, αποδόμησε τα επιχειρήματα του αντιπάλου.',
        feedback: 'Να είσαι πολύ αυστηρός, σαν κριτής σε τουρνουά debate.'
      }
    };

    const validDifficulty: Difficulty = ['beginner', 'intermediate', 'advanced', 'expert'].includes(difficulty) 
      ? difficulty as Difficulty 
      : 'intermediate';
    
    const settings = difficultySettings[validDifficulty];

    // Build conversation history
    const conversationHistory = previousMessages
      ?.filter((m: { role: string; content: string }) => m.role !== 'system')
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Μαθητής' : 'AI'}: ${m.content}`)
      .join('\n\n') || '';

    const systemPrompt = `Είσαι ένας AI αντίπαλος σε ένα εκπαιδευτικό debate για Έλληνες μαθητές.

ΘΕΜΑ: "${topic}"
ΕΣΥ ΥΠΟΣΤΗΡΙΖΕΙΣ: ${aiSideGreek}
Ο ΜΑΘΗΤΗΣ ΥΠΟΣΤΗΡΙΖΕΙ: ${userSideGreek}
ΓΥΡΟΣ: ${round}/${totalRounds}
ΔΥΣΚΟΛΙΑ: ${difficulty}

ΟΔΗΓΙΕΣ ΔΥΣΚΟΛΙΑΣ:
${settings.strength}

ΚΑΝΟΝΕΣ:
1. Απάντησε ΜΟΝΟ στα Ελληνικά
2. Κάνε ένα αντεπιχείρημα στα σημεία του μαθητή
3. Πρόσθεσε ένα νέο επιχείρημα υπέρ της θέσης σου
4. Κράτα την απάντησή σου σύντομη (2-3 παράγραφοι max)
5. Να είσαι ευγενικός αλλά ανταγωνιστικός

Μετά το επιχείρημά σου, δώσε:
- SCORE: (0-10 πόντοι για το επιχείρημα του μαθητή)
- FEEDBACK: ${settings.feedback}

Απάντησε σε αυτή τη μορφή:
[Το επιχείρημά σου]

---EVALUATION---
SCORE: [αριθμός 0-10]
FEEDBACK: [σύντομο feedback στα Ελληνικά]`;

    const userMessage = `Προηγούμενη συζήτηση:
${conversationHistory}

Νέο επιχείρημα του μαθητή:
${userArgument}

Απάντησε με αντεπιχείρημα και αξιολόγησε το επιχείρημα του μαθητή.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: userMessage }],
      system: systemPrompt,
    });

    const textContent = response.content.find(block => block.type === 'text');
    const fullResponse = textContent?.text || '';

    // Parse the response
    let aiArgument = fullResponse;
    let userScore = 5;
    let feedback = '';

    const evalSplit = fullResponse.split('---EVALUATION---');
    if (evalSplit.length > 1) {
      aiArgument = evalSplit[0].trim();
      const evalPart = evalSplit[1];
      
      // Extract score
      const scoreMatch = evalPart.match(/SCORE:\s*(\d+)/i);
      if (scoreMatch) {
        userScore = Math.min(10, Math.max(0, parseInt(scoreMatch[1])));
      }
      
      // Extract feedback (removed 's' flag, use [\s\S] instead for multiline)
      const feedbackMatch = evalPart.match(/FEEDBACK:\s*([\s\S]+)/i);
      if (feedbackMatch) {
        feedback = feedbackMatch[1].trim();
      }
    }

    // Calculate AI score based on difficulty
    const aiBaseScores: Record<Difficulty, number> = {
      beginner: 4,
      intermediate: 6,
      advanced: 7,
      expert: 8
    };
    
    const aiScore = aiBaseScores[validDifficulty] + Math.floor(Math.random() * 2);

    return NextResponse.json({
      aiArgument,
      userScore,
      aiScore,
      feedback,
      round
    });

  } catch (error) {
    console.error('Debate AI error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
