import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { MATH_LATEX_RULES } from '@/lib/math-prompt';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const image = formData.get('image') as File;
    const subject = formData.get('subject') as string || 'general';
    const gradeLevel = formData.get('gradeLevel') as string || 'gymnasium';
    const language = formData.get('language') as string || 'el';

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = image.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    // Create the prompt for Socratic guidance
    const systemPrompt = `Είσαι ο Noetia, ένας φιλικός AI δάσκαλος που βοηθάει Έλληνες μαθητές.
Χρησιμοποιείς τη Σωκρατική μέθοδο - δεν δίνεις απευθείας απαντήσεις, αλλά καθοδηγείς τον μαθητή με ερωτήσεις και hints.

Κανόνες:
1. ΠΟΤΕ μη δίνεις την τελική απάντηση απευθείας
2. Ξεκίνα αναγνωρίζοντας τι είδους άσκηση/πρόβλημα είναι
3. Εξήγησε τη μέθοδο επίλυσης βήμα-βήμα
4. Δώσε hints και ερωτήσεις που οδηγούν στη σωστή κατεύθυνση
5. Ενθάρρυνε τον μαθητή
6. Χρησιμοποίησε απλή γλώσσα κατάλληλη για ${gradeLevel === 'dimotiko' ? 'Δημοτικό' : gradeLevel === 'gymnasium' ? 'Γυμνάσιο' : 'Λύκειο'}

Μάθημα: ${subject}
Απάντησε στα ${language === 'el' ? 'Ελληνικά' : 'Αγγλικά'}.

${MATH_LATEX_RULES}`;

    const userPrompt = `Κοίταξε αυτή την άσκηση/πρόβλημα που ανέβασε ο μαθητής.

Βοήθησέ τον να καταλάβει:
1. Τι τύπου πρόβλημα είναι αυτό;
2. Ποια βήματα πρέπει να ακολουθήσει;
3. Ποιες γνώσεις/τύπους χρειάζεται;

Δώσε καθοδήγηση χωρίς να αποκαλύψεις την απάντηση.`;

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
                media_type: mimeType,
                data: base64,
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

    // Extract text from response
    const textContent = response.content.find(block => block.type === 'text');
    const guidance = textContent ? textContent.text : 'Δεν μπόρεσα να αναλύσω την εικόνα.';

    // Save to progress
    await supabase.from('user_progress').insert({
      user_id: user.id,
      feature: 'tools',
      activity_type: 'photo_helper',
      completed: true,
      metadata: { subject }
    });

    return NextResponse.json({ 
      guidance,
      subject,
      success: true
    });

  } catch (error) {
    console.error('Photo helper error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}

// Follow-up question endpoint
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question, context, imageBase64, mimeType } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'No question provided' }, { status: 400 });
    }

    const systemPrompt = `Είσαι ο Noetia, ένας φιλικός AI δάσκαλος.
Ο μαθητής έχει μια επιπλέον ερώτηση για την άσκηση που δουλεύει.
Συνέχισε να χρησιμοποιείς τη Σωκρατική μέθοδο - μην δίνεις απευθείας απαντήσεις.
Αν ρωτήσει "ποια είναι η απάντηση", εξήγησέ του ότι είναι καλύτερα να τη βρει μόνος του με τη βοήθειά σου.

${MATH_LATEX_RULES}

Προηγούμενο context: ${context}`;

    const messages: any[] = [
      {
        role: 'user',
        content: question,
      },
    ];

    // If there's still an image reference
    if (imageBase64 && mimeType) {
      messages[0].content = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mimeType,
            data: imageBase64,
          },
        },
        {
          type: 'text',
          text: question,
        },
      ];
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1000,
      messages,
      system: systemPrompt,
    });

    const textContent = response.content.find(block => block.type === 'text');
    const answer = textContent ? textContent.text : 'Δεν κατάλαβα την ερώτηση.';

    return NextResponse.json({ answer });

  } catch (error) {
    console.error('Follow-up error:', error);
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
}
