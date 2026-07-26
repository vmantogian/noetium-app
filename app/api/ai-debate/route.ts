import { NextRequest, NextResponse } from 'next/server';
import { features, featureDisabledResponse } from '@/lib/features';

// Difficulty-specific system prompts
const DIFFICULTY_PROMPTS: Record<string, string> = {
  easy: `Είσαι αντίπαλος επιπέδου αρχαρίων σε debate για Έλληνα μαθητή.
- Κάνε απλά, ξεκάθαρα επιχειρήματα
- Περιστασιακά συμπεριέλαβε μικρά λογικά κενά που ένας μαθητής θα μπορούσε να εντοπίσει
- Χρησιμοποίησε βασικό λεξιλόγιο
- Να είσαι ενθαρρυντικός ακόμα και στην αντιπολίτευση
- Μερικές φορές χάσε προφανή αντεπιχειρήματα
- Τα επιχειρήματά σου πρέπει να είναι 60-80 λέξεις
- Απάντησε στα Ελληνικά`,

  medium: `Είσαι αντίπαλος μεσαίου επιπέδου σε debate για Έλληνα μαθητή.
- Κάνε καλά δομημένα επιχειρήματα με ξεκάθαρη λογική
- Παρέχε αποδείξεις και παραδείγματα
- Άφησε κάποια ανοίγματα για αντεπιχειρήματα
- Αμφισβήτησε τα σημεία του αντιπάλου με σεβασμό
- Τα επιχειρήματά σου πρέπει να είναι 80-120 λέξεις
- Περιστασιακά αναγνώρισε έγκυρα σημεία του αντιπάλου
- Απάντησε στα Ελληνικά`,

  hard: `Είσαι προχωρημένος αντίπαλος σε debate για Έλληνα μαθητή.
- Παρουσίασε εξελιγμένα, καλά τεκμηριωμένα επιχειρήματα
- Πρόβλεψε και αντιμετώπισε προληπτικά αντεπιχειρήματα
- Χρησιμοποίησε ρητορικές τεχνικές αποτελεσματικά
- Αμφισβήτησε λογικές αδυναμίες στα επιχειρήματα του αντιπάλου
- Τα επιχειρήματά σου πρέπει να είναι 120-150 λέξεις
- Διατήρησε σεβαστική αλλά σταθερή αντιπολίτευση
- Απάντησε στα Ελληνικά`,

  expert: `Είσαι αντίπαλος επιπέδου πρωταθλήματος σε debate.
- Παρουσίασε συναρπαστικά, πολύπλοκα επιχειρήματα με πολλαπλά επίπεδα
- Χρησιμοποίησε προηγμένες ρητορικές τεχνικές και λογικά πλαίσια
- Εντόπισε και εκμεταλλεύσου κάθε αδυναμία στη συλλογιστική του αντιπάλου
- Αναφέρσου σε πραγματικά παραδείγματα και δεδομένα
- Τα επιχειρήματά σου πρέπει να είναι 150-200 λέξεις
- Ώθησε τον μαθητή στην καλύτερη απόδοσή του
- Ποτέ μην είσαι υποτιμητικός, αλλά γίνε πραγματικά προκλητικός
- Απάντησε στα Ελληνικά`
};

export async function POST(request: NextRequest) {
  if (!features.debate) return featureDisabledResponse();

  try {
    const body = await request.json();
    const { config, messages, currentRound, argumentType, difficulty } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ 
        error: 'ANTHROPIC_API_KEY not configured' 
      }, { status: 500 });
    }

    const systemPrompt = DIFFICULTY_PROMPTS[difficulty] || DIFFICULTY_PROMPTS.medium;
    
    // Build conversation context
    const conversationContext = messages.map((m: any) => 
      `${m.role === 'user' ? 'Μαθητής' : 'AI'}: ${m.content}`
    ).join('\n\n');

    const aiSide = config.userSide === 'affirmative' ? 'κατά' : 'υπέρ';
    const userSide = config.userSide === 'affirmative' ? 'υπέρ' : 'κατά';

    const prompt = `${systemPrompt}

ΘΕΜΑ DEBATE: ${config.topicEl || config.topic}
ΠΛΕΥΡΑ ΣΟΥ: ${aiSide} (ο μαθητής είναι ${userSide})
ΓΥΡΟΣ: ${currentRound}/${config.rounds}
ΤΥΠΟΣ ΕΠΙΧΕΙΡΗΜΑΤΟΣ: ${argumentType}

${config.backgroundInfoEl ? `ΠΛΗΡΟΦΟΡΙΕΣ: ${config.backgroundInfoEl}` : ''}

ΠΡΟΗΓΟΥΜΕΝΗ ΣΥΖΗΤΗΣΗ:
${conversationContext || '(Αυτό είναι το πρώτο επιχείρημα)'}

Δώσε το ${argumentType} επιχείρημά σου ${aiSide} του θέματος. Μην συμπεριλάβεις εισαγωγές όπως "Ως AI..." - απλά δώσε το επιχείρημα απευθείας.`;

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
    const argument = data.content[0]?.text || 'Συγγνώμη, δεν μπόρεσα να δημιουργήσω επιχείρημα.';

    return NextResponse.json({ argument });
  } catch (error: any) {
    console.error('AI Debate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
