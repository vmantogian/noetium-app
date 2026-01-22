import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

type AnalysisMode = 'homework' | 'text' | 'diagram' | 'general';

interface AnalysisRequest {
  imageBase64: string;
  mode?: AnalysisMode;
  subject?: string;
  additionalContext?: string;
  locale?: 'el' | 'en';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AnalysisRequest = await request.json();
    const { 
      imageBase64, 
      mode = 'general', 
      subject, 
      additionalContext,
      locale = 'el' 
    } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Clean base64 if it has data URL prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    
    // Detect image type
    const mediaType = detectMediaType(imageBase64);

    // Build the system prompt based on mode
    const systemPrompt = buildSystemPrompt(mode, subject, locale);
    const userPrompt = buildUserPrompt(mode, additionalContext, locale);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: cleanBase64,
              },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    const analysis = textContent?.text || '';

    // Parse structured response if applicable
    const result = parseAnalysisResult(analysis, mode);

    // Log usage
    try {
      await supabase.from('user_progress').insert({
        user_id: user.id,
        feature: 'photo_helper',
        activity_type: mode,
        metadata: { subject, hasText: result.extractedText ? true : false }
      });
    } catch (e) {
      console.error('Failed to log photo helper usage:', e);
    }

    return NextResponse.json({
      success: true,
      mode,
      ...result
    });

  } catch (error: any) {
    console.error('Photo helper error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}

function detectMediaType(base64: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  if (base64.startsWith('data:image/png')) return 'image/png';
  if (base64.startsWith('data:image/gif')) return 'image/gif';
  if (base64.startsWith('data:image/webp')) return 'image/webp';
  return 'image/jpeg';
}

function buildSystemPrompt(mode: AnalysisMode, subject?: string, locale?: string): string {
  const isGreek = locale === 'el';
  
  const basePrompt = isGreek
    ? 'Είσαι ένας έξυπνος βοηθός για Έλληνες μαθητές. Απάντησε ΜΟΝΟ στα Ελληνικά.'
    : 'You are a helpful assistant for students.';

  const modePrompts: Record<AnalysisMode, string> = {
    homework: isGreek
      ? `${basePrompt}

ΡΟΛΟΣ: Βοηθάς μαθητές να κατανοήσουν και να λύσουν ασκήσεις.

ΚΑΝΟΝΕΣ:
1. ΔΙΑΒΑΣΕ προσεκτικά όλο το κείμενο στην εικόνα
2. ΕΝΤΟΠΙΣΕ τι ζητάει η άσκηση
3. ΜΗ δίνεις απευθείας τη λύση
4. ΕΞΗΓΗΣΕ τη μέθοδο επίλυσης βήμα-βήμα
5. ΔΩΣΕ hints αν χρειάζεται
6. Αν υπάρχουν πολλαπλές ασκήσεις, αναγνώρισέ τες όλες

ΜΟΡΦΗ ΑΠΑΝΤΗΣΗΣ:
---EXTRACTED_TEXT---
[Το κείμενο που διαβάζεις στην εικόνα]
---ANALYSIS---
[Ανάλυση της άσκησης]
---HINTS---
[Hints για τη λύση]
---METHOD---
[Βήματα επίλυσης]`
      : `${basePrompt}

ROLE: Help students understand and solve exercises.

RULES:
1. READ all text in the image carefully
2. IDENTIFY what the exercise asks
3. DO NOT give direct answers
4. EXPLAIN the solving method step by step
5. GIVE hints if needed

RESPONSE FORMAT:
---EXTRACTED_TEXT---
[Text you read in the image]
---ANALYSIS---
[Analysis of the exercise]
---HINTS---
[Hints for solving]
---METHOD---
[Steps to solve]`,

    text: isGreek
      ? `${basePrompt}

ΡΟΛΟΣ: Εξαγωγή και μεταγραφή κειμένου από εικόνες.

ΚΑΝΟΝΕΣ:
1. ΔΙΑΒΑΣΕ όλο το κείμενο στην εικόνα
2. ΔΙΑΤΗΡΗΣΕ τη μορφοποίηση όσο γίνεται
3. Αν είναι χειρόγραφο, κάνε ό,τι καλύτερο μπορείς
4. Σημείωσε αν κάτι δεν είναι ευανάγνωστο

ΜΟΡΦΗ ΑΠΑΝΤΗΣΗΣ:
---EXTRACTED_TEXT---
[Ακριβής μεταγραφή του κειμένου]
---NOTES---
[Παρατηρήσεις για δυσανάγνωστα σημεία]`
      : `${basePrompt}

ROLE: Extract and transcribe text from images.

RULES:
1. READ all text in the image
2. PRESERVE formatting where possible
3. If handwritten, do your best
4. Note any illegible parts

RESPONSE FORMAT:
---EXTRACTED_TEXT---
[Exact transcription]
---NOTES---
[Notes on unclear parts]`,

    diagram: isGreek
      ? `${basePrompt}

ΡΟΛΟΣ: Ανάλυση διαγραμμάτων, σχημάτων και γραφημάτων.

ΚΑΝΟΝΕΣ:
1. ΠΕΡΙΕΓΡΑΨΕ τι δείχνει το διάγραμμα
2. ΕΝΤΟΠΙΣΕ τα βασικά στοιχεία
3. ΕΞΗΓΗΣΕ τις σχέσεις μεταξύ τους
4. Αν υπάρχουν αριθμοί ή ετικέτες, αναφέρουν τους

ΜΟΡΦΗ ΑΠΑΝΤΗΣΗΣ:
---DIAGRAM_TYPE---
[Τύπος διαγράμματος]
---ELEMENTS---
[Στοιχεία που εντοπίζονται]
---EXPLANATION---
[Ανάλυση και εξήγηση]`
      : `${basePrompt}

ROLE: Analyze diagrams, figures, and charts.

RESPONSE FORMAT:
---DIAGRAM_TYPE---
[Type of diagram]
---ELEMENTS---
[Identified elements]
---EXPLANATION---
[Analysis and explanation]`,

    general: isGreek
      ? `${basePrompt}

ΡΟΛΟΣ: Γενική ανάλυση εικόνας για εκπαιδευτικούς σκοπούς.

ΚΑΝΟΝΕΣ:
1. ΠΕΡΙΕΓΡΑΨΕ τι βλέπεις στην εικόνα
2. Αν υπάρχει κείμενο, ΔΙΑΒΑΣΕ το
3. ΕΞΗΓΗΣΕ τι σημαίνει για έναν μαθητή
4. ΠΡΟΤΕΙΝΕ πώς μπορεί να βοηθήσει στη μάθηση`
      : `${basePrompt}

ROLE: General image analysis for educational purposes.

RULES:
1. DESCRIBE what you see
2. If there's text, READ it
3. EXPLAIN what it means for a student
4. SUGGEST how it can help learning`
  };

  let prompt = modePrompts[mode];
  
  if (subject) {
    const subjectContext = isGreek
      ? `\n\nΜΑΘΗΜΑ: ${subject}. Προσαρμόσε την ανάλυση στο συγκεκριμένο μάθημα.`
      : `\n\nSUBJECT: ${subject}. Adapt the analysis to this subject.`;
    prompt += subjectContext;
  }

  return prompt;
}

function buildUserPrompt(mode: AnalysisMode, additionalContext?: string, locale?: string): string {
  const isGreek = locale === 'el';
  
  const modePrompts: Record<AnalysisMode, string> = {
    homework: isGreek
      ? 'Ανάλυσε αυτή την άσκηση και βοήθησέ με να την κατανοήσω.'
      : 'Analyze this exercise and help me understand it.',
    text: isGreek
      ? 'Διάβασε και μεταγράφε το κείμενο από αυτή την εικόνα.'
      : 'Read and transcribe the text from this image.',
    diagram: isGreek
      ? 'Ανάλυσε αυτό το διάγραμμα και εξήγησέ μου τι δείχνει.'
      : 'Analyze this diagram and explain what it shows.',
    general: isGreek
      ? 'Τι βλέπεις σε αυτή την εικόνα; Πώς μπορεί να με βοηθήσει στη μάθηση;'
      : 'What do you see in this image? How can it help me learn?'
  };

  let prompt = modePrompts[mode];
  
  if (additionalContext) {
    prompt += `\n\n${isGreek ? 'Επιπλέον πληροφορίες' : 'Additional context'}: ${additionalContext}`;
  }

  return prompt;
}

interface AnalysisResult {
  extractedText?: string;
  analysis?: string;
  hints?: string;
  method?: string;
  diagramType?: string;
  elements?: string;
  explanation?: string;
  notes?: string;
  rawResponse: string;
}

function parseAnalysisResult(response: string, mode: AnalysisMode): AnalysisResult {
  const result: AnalysisResult = { rawResponse: response };

  // Extract sections using regex
  const extractSection = (marker: string): string | undefined => {
    const regex = new RegExp(`---${marker}---\\s*([\\s\\S]*?)(?=---|$)`, 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : undefined;
  };

  result.extractedText = extractSection('EXTRACTED_TEXT');
  result.analysis = extractSection('ANALYSIS');
  result.hints = extractSection('HINTS');
  result.method = extractSection('METHOD');
  result.diagramType = extractSection('DIAGRAM_TYPE');
  result.elements = extractSection('ELEMENTS');
  result.explanation = extractSection('EXPLANATION');
  result.notes = extractSection('NOTES');

  // If no structured sections found, use raw response as analysis
  if (!result.extractedText && !result.analysis && !result.explanation) {
    result.analysis = response;
  }

  return result;
}
