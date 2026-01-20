import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const subjectPrompts: Record<string, string> = {
  math: 'Είσαι ειδικός στα Μαθηματικά. Χρησιμοποίησε παραδείγματα με αριθμούς και σχήματα.',
  physics: 'Είσαι ειδικός στη Φυσική. Εξήγησε με πειράματα και παραδείγματα από την καθημερινότητα.',
  chemistry: 'Είσαι ειδικός στη Χημεία. Χρησιμοποίησε μοριακά μοντέλα και αντιδράσεις.',
  biology: 'Είσαι ειδικός στη Βιολογία. Εξήγησε με αναφορές σε ζωντανούς οργανισμούς.',
  history: 'Είσαι ειδικός στην Ιστορία. Χρησιμοποίησε ιστορίες και χρονολογίες.',
  greek: 'Είσαι ειδικός στα Ελληνικά. Βοήθα με γραμματική, συντακτικό και λογοτεχνία.',
  geography: 'Είσαι ειδικός στη Γεωγραφία. Χρησιμοποίησε χάρτες και τοποθεσίες.',
  general: 'Είσαι γενικός δάσκαλος. Βοήθα με οποιοδήποτε θέμα.',
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, subject, conversationHistory } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    const subjectContext = subjectPrompts[subject] || subjectPrompts.general;

    const systemPrompt = `Είσαι ο Noetia, ένας φιλικός AI δάσκαλος για Έλληνες μαθητές.

${subjectContext}

ΚΑΝΟΝΕΣ ΣΩΚΡΑΤΙΚΗΣ ΜΕΘΟΔΟΥ:
1. ΠΟΤΕ μη δίνεις απευθείας απαντήσεις σε ασκήσεις
2. Κάνε ερωτήσεις που οδηγούν τον μαθητή στη σωστή κατεύθυνση
3. Δώσε hints αντί για λύσεις
4. Ενθάρρυνε τον μαθητή όταν κάνει πρόοδο
5. Αν ρωτήσει "ποια είναι η απάντηση", εξήγησε ότι είναι καλύτερα να τη βρει μόνος του
6. Χρησιμοποίησε απλή γλώσσα κατάλληλη για μαθητές Γυμνασίου/Λυκείου

ΣΤΥΛ:
- Φιλικός και ενθαρρυντικός τόνος
- Χρησιμοποίησε emoji με μέτρο
- Κράτα τις απαντήσεις σύντομες (2-3 παράγραφοι max)
- Κάνε μία ερώτηση τη φορά

Απάντησε ΜΟΝΟ στα Ελληνικά.`;

    // Build messages array
    const messages: Anthropic.MessageParam[] = conversationHistory?.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    })) || [];

    messages.push({ role: 'user', content: message });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages,
    });

    const textContent = response.content.find(block => block.type === 'text');
    const aiResponse = textContent?.text || 'Συγγνώμη, δεν κατάλαβα. Μπορείς να το ξαναδιατυπώσεις;';

    // Save chat interaction to progress
    await supabase.from('user_progress').insert({
      user_id: user.id,
      feature: 'chat',
      activity_type: 'conversation',
      activity_id: subject,
      completed: true,
      metadata: { subject }
    });

    return NextResponse.json({ response: aiResponse });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat' },
      { status: 500 }
    );
  }
}
