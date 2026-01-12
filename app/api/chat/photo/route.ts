import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { message, image, subject, grade, history = [] } = await request.json()

    if (!image) {
      return NextResponse.json({ error: 'Image required' }, { status: 400 })
    }

    // Extract base64 data from data URL
    const base64Data = image.split(',')[1]
    const mediaType = image.split(';')[0].split(':')[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

    const gradeContext = grade ? `Ο μαθητής είναι στην ${grade.replace('_', ' ')}.` : ''
    const subjectContext = subject ? `Το μάθημα είναι ${subject}.` : ''

    const systemPrompt = `Είσαι ένας υπομονετικός και ενθαρρυντικός Έλληνας καθηγητής που βοηθά μαθητές να λύσουν ασκήσεις.

${gradeContext}
${subjectContext}

ΟΔΗΓΙΕΣ:
1. Ανάλυσε την εικόνα της άσκησης προσεκτικά
2. ΜΗΝ δώσεις την απάντηση αμέσως - βοήθησε τον μαθητή να σκεφτεί
3. Ξεκίνα αναγνωρίζοντας τι ζητάει η άσκηση
4. Δώσε hints και οδηγίες βήμα-βήμα
5. Ρώτησε τον μαθητή αν κατάλαβε πριν προχωρήσεις
6. Αν ο μαθητής ζητήσει τη λύση, δώσε την με αναλυτική εξήγηση
7. Χρησιμοποίησε LaTeX για μαθηματικούς τύπους όπου χρειάζεται

ΣΗΜΑΝΤΙΚΟ: Αν η εικόνα δεν είναι άσκηση ή δεν φαίνεται καθαρά, ζήτησε διευκρινίσεις.

Ξεκίνα με μια φιλική αναγνώριση του τι βλέπεις στην άσκηση.`

    const messages: any[] = [
      ...history.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
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
            text: message || 'Βοήθησέ με να λύσω αυτή την άσκηση. Μη μου δώσεις την απάντηση, αλλά οδήγησέ με βήμα-βήμα.',
          },
        ],
      },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages,
    })

    const answer = (response.content[0] as any).text

    return NextResponse.json({
      answer,
      sources: [], // No textbook sources for image analysis
    })
  } catch (error) {
    console.error('Photo analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
