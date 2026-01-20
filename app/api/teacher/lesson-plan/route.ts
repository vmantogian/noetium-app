import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { topic, grade, subject, duration, additionalContext, curriculumCode } = await request.json();

    const systemPrompt = `Είσαι ένας έμπειρος Έλληνας εκπαιδευτικός που δημιουργεί λεπτομερή σχέδια μαθήματος. 
    Τα σχέδια σου είναι πρακτικά, δομημένα και προσαρμοσμένα στο ελληνικό εκπαιδευτικό σύστημα.
    Χρησιμοποιείς τη Σωκρατική μέθοδο και ενθαρρύνεις την ενεργή συμμετοχή των μαθητών.`;

    const userPrompt = `Δημιούργησε ένα λεπτομερές σχέδιο μαθήματος για:

**Θέμα:** ${topic}
**Τάξη:** ${grade}
**Μάθημα:** ${subject}
**Διάρκεια:** ${duration}
${curriculumCode ? `**Κωδικός Αναλυτικού:** ${curriculumCode}` : ''}
${additionalContext ? `**Πρόσθετες Πληροφορίες:** ${additionalContext}` : ''}

Το σχέδιο μαθήματος πρέπει να περιλαμβάνει:

1. **Μαθησιακοί Στόχοι** (3-4 στόχοι)
2. **Απαιτούμενα Υλικά**
3. **Εισαγωγή / Hook** (${Math.round(parseInt(duration) * 0.1)} λεπτά)
4. **Κύριο Μέρος** (${Math.round(parseInt(duration) * 0.7)} λεπτά)
   - Παρουσίαση νέας ύλης
   - Δραστηριότητες μαθητών
   - Ερωτήσεις για συζήτηση
5. **Εξάσκηση** (${Math.round(parseInt(duration) * 0.15)} λεπτά)
6. **Ανακεφαλαίωση** (${Math.round(parseInt(duration) * 0.05)} λεπτά)
7. **Αξιολόγηση** (πώς θα ελέγξεις την κατανόηση)
8. **Διαφοροποίηση** (για μαθητές με διαφορετικές ανάγκες)
9. **Εργασία για το Σπίτι** (προαιρετικό)

Γράψε σε φυσικό, πρακτικό ύφος που μπορεί να χρησιμοποιήσει άμεσα ένας εκπαιδευτικός.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt,
    });

    const lessonPlan = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    return NextResponse.json({ lessonPlan });
  } catch (error) {
    console.error('Lesson Plan API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate lesson plan' },
      { status: 500 }
    );
  }
}
