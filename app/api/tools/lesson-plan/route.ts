import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const GRADE_NAMES: Record<string, string> = {
  'a_gymnasiou': 'Α\' Γυμνασίου',
  'b_gymnasiou': 'Β\' Γυμνασίου',
  'g_gymnasiou': 'Γ\' Γυμνασίου',
  'a_lykeiou': 'Α\' Λυκείου',
  'b_lykeiou': 'Β\' Λυκείου',
  'g_lykeiou': 'Γ\' Λυκείου',
}

const SUBJECT_NAMES: Record<string, string> = {
  'fysiki': 'Φυσική',
  'mathimatika': 'Μαθηματικά',
  'chimeia': 'Χημεία',
  'viologia': 'Βιολογία',
  'istoria': 'Ιστορία',
  'neoelliniki': 'Νεοελληνική Γλώσσα',
  'archaia': 'Αρχαία Ελληνικά',
}

export async function POST(request: NextRequest) {
  try {
    const { topic, gradeLevel, subject, duration, additionalInfo } = await request.json()

    if (!topic || !gradeLevel || !subject) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const gradeName = GRADE_NAMES[gradeLevel] || gradeLevel
    const subjectName = SUBJECT_NAMES[subject] || subject

    const prompt = `Είσαι ένας έμπειρος Έλληνας εκπαιδευτικός σύμβουλος. Δημιούργησε ένα λεπτομερές σχέδιο μαθήματος με βάση τα παρακάτω:

**Θέμα:** ${topic}
**Τάξη:** ${gradeName}
**Μάθημα:** ${subjectName}
**Διάρκεια:** ${duration} λεπτά
${additionalInfo ? `**Επιπλέον πληροφορίες:** ${additionalInfo}` : ''}

Το σχέδιο μαθήματος πρέπει να περιλαμβάνει:

1. **ΜΑΘΗΣΙΑΚΟΙ ΣΤΟΧΟΙ** (3-5 στόχοι)
   - Τι θα μπορούν να κάνουν οι μαθητές μετά το μάθημα

2. **ΑΠΑΡΑΙΤΗΤΑ ΥΛΙΚΑ**
   - Λίστα με υλικά και πόρους

3. **ΠΟΡΕΙΑ ΜΑΘΗΜΑΤΟΣ**

   **Αφόρμηση (${Math.round(parseInt(duration) * 0.1)} λεπτά)**
   - Δραστηριότητα που κεντρίζει το ενδιαφέρον

   **Κύριο Μέρος (${Math.round(parseInt(duration) * 0.7)} λεπτά)**
   - Αναλυτική παρουσίαση περιεχομένου
   - Δραστηριότητες μαθητών
   - Ερωτήσεις για συζήτηση

   **Κλείσιμο (${Math.round(parseInt(duration) * 0.2)} λεπτά)**
   - Ανακεφαλαίωση
   - Αξιολόγηση κατανόησης

4. **ΔΙΑΦΟΡΟΠΟΙΗΣΗ**
   - Προτάσεις για μαθητές που χρειάζονται επιπλέον υποστήριξη
   - Προτάσεις για προχωρημένους μαθητές

5. **ΑΞΙΟΛΟΓΗΣΗ**
   - Τρόποι ελέγχου κατανόησης

Απάντησε στα Ελληνικά με σαφή δομή και πρακτικές προτάσεις.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = (response.content[0] as any).text

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Lesson plan API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
