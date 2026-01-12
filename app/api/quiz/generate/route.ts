import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { content, subject, questionCount, difficulty } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 })
    }

    const difficultyInstructions = {
      easy: 'Οι ερωτήσεις πρέπει να είναι απλές, με σαφείς απαντήσεις που βασίζονται άμεσα στο κείμενο.',
      medium: 'Οι ερωτήσεις πρέπει να απαιτούν κατανόηση και μικρή ανάλυση του υλικού.',
      hard: 'Οι ερωτήσεις πρέπει να απαιτούν κριτική σκέψη, σύνθεση και εφαρμογή γνώσεων.',
    }

    const prompt = `Είσαι ένας έμπειρος Έλληνας εκπαιδευτικός που δημιουργεί quiz για μαθητές.

Δημιούργησε ένα quiz με ${questionCount} ερωτήσεις πολλαπλής επιλογής βασισμένο στο παρακάτω υλικό:

---
${content}
---

${subject ? `Το μάθημα είναι: ${subject}` : ''}
Επίπεδο δυσκολίας: ${difficulty}
${difficultyInstructions[difficulty as keyof typeof difficultyInstructions]}

ΑΠΑΝΤΗΣΕ ΜΟΝΟ σε JSON format με την εξής δομή (χωρίς markdown, χωρίς backticks):
{
  "questions": [
    {
      "id": "q1",
      "question": "Η ερώτηση εδώ",
      "options": ["Επιλογή Α", "Επιλογή Β", "Επιλογή Γ", "Επιλογή Δ"],
      "correctAnswer": 0,
      "explanation": "Εξήγηση γιατί αυτή είναι η σωστή απάντηση"
    }
  ]
}

ΚΑΝΟΝΕΣ:
1. Ακριβώς ${questionCount} ερωτήσεις
2. Ακριβώς 4 επιλογές ανά ερώτηση
3. correctAnswer είναι το index (0-3) της σωστής απάντησης
4. Κάθε ερώτηση να έχει μοναδικό id
5. Οι λάθος επιλογές να είναι λογικές αλλά σαφώς λανθασμένες
6. Η εξήγηση να είναι σύντομη και κατατοπιστική`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = (response.content[0] as any).text

    // Parse JSON response
    let questions
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        questions = parsed.questions
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      // Fallback: generate simple questions
      questions = [
        {
          id: 'q1',
          question: 'Δοκιμαστική ερώτηση - Το quiz δεν μπόρεσε να δημιουργηθεί σωστά',
          options: ['Επιλογή Α', 'Επιλογή Β', 'Επιλογή Γ', 'Επιλογή Δ'],
          correctAnswer: 0,
          explanation: 'Παρακαλώ δοκίμασε ξανά με διαφορετικό περιεχόμενο.',
        },
      ]
    }

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Quiz generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
