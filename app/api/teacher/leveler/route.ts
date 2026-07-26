import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const gradeLabels: Record<string, string> = {
  'e_dimotiko': 'Ε\' Δημοτικού (10-11 ετών)',
  'st_dimotiko': 'ΣΤ\' Δημοτικού (11-12 ετών)',
  'a_gymnasio': 'Α\' Γυμνασίου (12-13 ετών)',
  'b_gymnasio': 'Β\' Γυμνασίου (13-14 ετών)',
  'c_gymnasio': 'Γ\' Γυμνασίου (14-15 ετών)',
  'a_lykeio': 'Α\' Λυκείου (15-16 ετών)',
  'b_lykeio': 'Β\' Λυκείου (16-17 ετών)',
  'c_lykeio': 'Γ\' Λυκείου (17-18 ετών)',
};

export async function POST(request: NextRequest) {
  try {
    const { title, originalText, targetGrade, preserveLength } = await request.json();

    const gradeLabel = gradeLabels[targetGrade] || targetGrade;

    const systemPrompt = `Είσαι ένας έμπειρος Έλληνας εκπαιδευτικός που προσαρμόζει κείμενα σε διαφορετικά επίπεδα δυσκολίας.
    Διατηρείς το νόημα και τις βασικές πληροφορίες αλλά προσαρμόζεις:
    - Το λεξιλόγιο στο κατάλληλο επίπεδο
    - Το μήκος και την πολυπλοκότητα των προτάσεων
    - Τις εξηγήσεις δύσκολων εννοιών
    
    Για μικρότερες τάξεις: πιο απλές λέξεις, πιο κοντές προτάσεις, περισσότερα παραδείγματα
    Για μεγαλύτερες τάξεις: πιο εξειδικευμένο λεξιλόγιο, πιο σύνθετη δομή`;

    const userPrompt = `Αναπροσάρμοσε το παρακάτω κείμενο για μαθητές ${gradeLabel}:

**Τίτλος:** ${title}

**Αρχικό Κείμενο:**
${originalText}

**Οδηγίες:**
- Διατήρησε τις βασικές πληροφορίες και το νόημα
- Προσάρμοσε το λεξιλόγιο για την ηλικία ${gradeLabel}
- ${preserveLength ? 'Διατήρησε παρόμοιο μήκος με το αρχικό' : 'Μπορείς να αλλάξεις το μήκος αν χρειάζεται'}
- Εξήγησε τυχόν δύσκολους όρους με απλά λόγια
- Κράτησε την αφηγηματική δομή

Δώσε ΜΟΝΟ το αναπροσαρμοσμένο κείμενο, χωρίς επιπλέον σχόλια ή επεξηγήσεις.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 3000,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt,
    });

    const leveledText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    return NextResponse.json({ leveledText });
  } catch (error) {
    console.error('Leveler API Error:', error);
    return NextResponse.json(
      { error: 'Failed to level text' },
      { status: 500 }
    );
  }
}
