import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

// Initialize clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Book name mapping - converts file paths to friendly book names
const BOOK_NAMES: Record<string, string> = {
  // Physics
  'fysiki_a_lykeiou': 'Φυσική Α\' Λυκείου',
  'fysiki_b_lykeiou': 'Φυσική Β\' Λυκείου',
  'fysiki_g_lykeiou': 'Φυσική Γ\' Λυκείου',
  'fysiki_a_gymnasiou': 'Φυσική Α\' Γυμνασίου',
  'fysiki_b_gymnasiou': 'Φυσική Β\' Γυμνασίου',
  'fysiki_g_gymnasiou': 'Φυσική Γ\' Γυμνασίου',
  // Mathematics
  'mathimatika_a_lykeiou': 'Μαθηματικά Α\' Λυκείου',
  'mathimatika_b_lykeiou': 'Μαθηματικά Β\' Λυκείου',
  'mathimatika_g_lykeiou': 'Μαθηματικά Γ\' Λυκείου',
  'algebra_a_lykeiou': 'Άλγεβρα Α\' Λυκείου',
  'algebra_b_lykeiou': 'Άλγεβρα Β\' Λυκείου',
  'geometria_a_lykeiou': 'Γεωμετρία Α\' Λυκείου',
  'geometria_b_lykeiou': 'Γεωμετρία Β\' Λυκείου',
  'analysi': 'Ανάλυση',
  // Chemistry
  'chimeia_a_lykeiou': 'Χημεία Α\' Λυκείου',
  'chimeia_b_lykeiou': 'Χημεία Β\' Λυκείου',
  'chimeia_g_lykeiou': 'Χημεία Γ\' Λυκείου',
  'chimeia_a_gymnasiou': 'Χημεία Α\' Γυμνασίου',
  'chimeia_b_gymnasiou': 'Χημεία Β\' Γυμνασίου',
  'chimeia_g_gymnasiou': 'Χημεία Γ\' Γυμνασίου',
  // Biology
  'viologia_a_lykeiou': 'Βιολογία Α\' Λυκείου',
  'viologia_b_lykeiou': 'Βιολογία Β\' Λυκείου',
  'viologia_g_lykeiou': 'Βιολογία Γ\' Λυκείου',
  'viologia_a_gymnasiou': 'Βιολογία Α\' Γυμνασίου',
  'viologia_b_gymnasiou': 'Βιολογία Β\' Γυμνασίου',
  'viologia_g_gymnasiou': 'Βιολογία Γ\' Γυμνασίου',
  // History
  'istoria_a_lykeiou': 'Ιστορία Α\' Λυκείου',
  'istoria_b_lykeiou': 'Ιστορία Β\' Λυκείου',
  'istoria_g_lykeiou': 'Ιστορία Γ\' Λυκείου',
  'istoria_a_gymnasiou': 'Ιστορία Α\' Γυμνασίου',
  'istoria_b_gymnasiou': 'Ιστορία Β\' Γυμνασίου',
  'istoria_g_gymnasiou': 'Ιστορία Γ\' Γυμνασίου',
  // Default fallbacks by subject
  'fysiki': 'Φυσική',
  'mathimatika': 'Μαθηματικά',
  'chimeia': 'Χημεία',
  'viologia': 'Βιολογία',
  'istoria': 'Ιστορία',
  'geografia': 'Γεωγραφία',
  'neoelliniki': 'Νεοελληνική Γλώσσα',
  'archaia': 'Αρχαία Ελληνικά',
}

// Function to extract clean book name from file path
function getBookName(filePath: string): string {
  if (!filePath) return 'Σχολικό Βιβλίο'
  
  // Extract filename from path (remove corpus/, .pdf, etc.)
  const fileName = filePath
    .replace(/^.*[\\\/]/, '') // Remove directory path
    .replace('.pdf', '')
    .replace('.PDF', '')
    .toLowerCase()
    .replace(/[_\-\s]+/g, '_') // Normalize separators

  // Try exact match first
  if (BOOK_NAMES[fileName]) {
    return BOOK_NAMES[fileName]
  }

  // Try partial matches
  for (const [key, name] of Object.entries(BOOK_NAMES)) {
    if (fileName.includes(key) || key.includes(fileName)) {
      return name
    }
  }

  // Try to extract grade level and subject from filename
  const gradeMatch = fileName.match(/(a|b|g|α|β|γ)_(lykeiou|gymnasiou|λυκείου|γυμνασίου)/i)
  const subjectMatch = fileName.match(/(fysiki|mathimatika|chimeia|viologia|istoria|φυσική|μαθηματικά|χημεία|βιολογία|ιστορία)/i)
  
  if (subjectMatch && gradeMatch) {
    const gradeMap: Record<string, string> = {
      'a': 'Α\'', 'α': 'Α\'',
      'b': 'Β\'', 'β': 'Β\'', 
      'g': 'Γ\'', 'γ': 'Γ\''
    }
    const levelMap: Record<string, string> = {
      'lykeiou': 'Λυκείου', 'λυκείου': 'Λυκείου',
      'gymnasiou': 'Γυμνασίου', 'γυμνασίου': 'Γυμνασίου'
    }
    const subjectMap: Record<string, string> = {
      'fysiki': 'Φυσική', 'φυσική': 'Φυσική',
      'mathimatika': 'Μαθηματικά', 'μαθηματικά': 'Μαθηματικά',
      'chimeia': 'Χημεία', 'χημεία': 'Χημεία',
      'viologia': 'Βιολογία', 'βιολογία': 'Βιολογία',
      'istoria': 'Ιστορία', 'ιστορία': 'Ιστορία',
    }
    
    const grade = gradeMap[gradeMatch[1].toLowerCase()] || ''
    const level = levelMap[gradeMatch[2].toLowerCase()] || ''
    const subject = subjectMap[subjectMatch[1].toLowerCase()] || subjectMatch[1]
    
    return `${subject} ${grade} ${level}`.trim()
  }

  // Fallback: Clean up the filename
  return fileName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .substring(0, 50) || 'Σχολικό Βιβλίο'
}

// Subject detection keywords
const SUBJECT_KEYWORDS: Record<string, string[]> = {
  fysiki: ['φυσική', 'νεύτων', 'δύναμη', 'ενέργεια', 'ταχύτητα', 'επιτάχυνση', 
           'κίνηση', 'ηλεκτρ', 'μαγνητ', 'κύμα', 'ταλάντωση', 'στερεό σώμα',
           'ροπή', 'στροφορμή', 'θερμότητα', 'πίεση'],
  mathimatika: ['μαθηματικ', 'εξίσωση', 'συνάρτηση', 'παράγωγος', 'ολοκλήρωμα',
                'γεωμετρία', 'τρίγωνο', 'κύκλος', 'πολυώνυμο', 'λογάριθμος',
                'fermat', 'θεώρημα', 'ακρότατ', 'bolzano', 'rolle', 'όριο'],
  chimeia: ['χημεία', 'χημικ', 'αντίδραση', 'στοιχείο', 'ένωση', 'οξύ', 'βάση',
            'μόριο', 'άτομο', 'ηλεκτρόνιο', 'πρωτόνιο'],
  viologia: ['βιολογία', 'κύτταρο', 'dna', 'γονίδιο', 'οργανισμός', 'φωτοσύνθεση',
             'αναπαραγωγή', 'γονιμοποίηση', 'εξέλιξη'],
  istoria: ['ιστορία', 'πόλεμος', 'επανάσταση', 'αρχαί', 'βυζάντιο', 'οθωμαν'],
}

const SUBJECT_NAMES: Record<string, string> = {
  fysiki: 'Φυσική',
  mathimatika: 'Μαθηματικά',
  chimeia: 'Χημεία',
  viologia: 'Βιολογία',
  istoria: 'Ιστορία',
  neoelliniki: 'Νεοελληνική Γλώσσα',
  archaia_ellinika: 'Αρχαία Ελληνικά',
}

function detectSubject(text: string, history: any[]): string | null {
  const lowerText = text.toLowerCase()
  
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return subject
      }
    }
  }
  
  // Check history
  if (history && history.length > 0) {
    const recentText = history.slice(-4).map(m => m.content.toLowerCase()).join(' ')
    for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
      const matches = keywords.filter(kw => recentText.includes(kw)).length
      if (matches >= 2) {
        return subject
      }
    }
  }
  
  return null
}

async function expandQuery(
  question: string, 
  subject: string | null, 
  history: any[]
): Promise<string> {
  const subjectContext = subject ? `Το μάθημα είναι: ${SUBJECT_NAMES[subject] || subject}.` : ''
  
  const conversationContext = history.length > 0
    ? `\nΠρόσφατη συνομιλία:\n${history.slice(-4).map(m => 
        `${m.role === 'user' ? 'Μαθητής' : 'Καθηγητής'}: ${m.content.slice(0, 200)}`
      ).join('\n')}\n`
    : ''

  const prompt = `Είσαι βοηθός για ένα ελληνικό εκπαιδευτικό σύστημα αναζήτησης για ΣΧΟΛΙΚΑ ΒΙΒΛΙΑ ΔΕΥΤΕΡΟΒΑΘΜΙΑΣ ΕΚΠΑΙΔΕΥΣΗΣ (Γυμνάσιο & Λύκειο).

Ο μαθητής ρώτησε: "${question}"
${subjectContext}
${conversationContext}

ΣΗΜΑΝΤΙΚΟ - ΕΛΛΗΝΙΚΟ ΕΚΠΑΙΔΕΥΤΙΚΟ ΠΛΑΙΣΙΟ:
- "Θεώρημα Fermat" = Θεώρημα για ΤΟΠΙΚΑ ΑΚΡΟΤΑΤΑ (αν η f έχει τοπικό ακρότατο στο x₀ και είναι παραγωγίσιμη, τότε f'(x₀)=0)
- "Θεώρημα Bolzano" = Θεώρημα για ρίζες συνεχών συναρτήσεων
- "Θεώρημα Μέσης Τιμής" = Θεώρημα του διαφορικού λογισμού

Μετέτρεψε αυτή την ερώτηση σε λέξεις-κλειδιά αναζήτησης.

Κανόνες:
1. Χρησιμοποίησε την ορολογία των σχολικών βιβλίων
2. Πρόσθεσε συνώνυμα και σχετικούς όρους
3. Συμπερίλαβε τύπους αν είναι σχετικοί
4. ΑΝ υπάρχει πρόσφατη συνομιλία, ΧΡΗΣΙΜΟΠΟΙΗΣΕ ΤΗΝ για να καταλάβεις το πλαίσιο
5. Απάντησε ΜΟΝΟ με τις λέξεις-κλειδιά, χωρισμένες με κενά
6. Μέγιστο 15 λέξεις`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 100,
    messages: [{ role: 'user', content: prompt }],
  })

  return (response.content[0] as any).text.trim()
}

async function searchCorpus(
  query: string, 
  subject: string | null, 
  limit: number = 8
) {
  // Create embedding
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  })
  const embedding = embeddingResponse.data[0].embedding

  // Search
  const filter = subject ? { subject } : {}
  
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_count: limit,
    filter,
  })

  if (error) {
    console.error('Search error:', error)
    return []
  }

  // Filter by minimum similarity
  return data.filter((r: any) => r.similarity >= 0.25)
}

async function generateAnswer(
  question: string,
  context: any[],
  subject: string | null,
  history: any[]
): Promise<string> {
  const subjectInstruction = subject 
    ? `Το μάθημα είναι ${SUBJECT_NAMES[subject] || subject}.`
    : ''

  const contextParts = context.map((chunk, i) => {
    const bookName = getBookName(chunk.metadata?.source_file || '')
    return `[Πηγή ${i + 1}: ${bookName}]\n${chunk.content.slice(0, 1500)}`
  })

  const contextText = contextParts.length > 0 
    ? contextParts.join('\n\n---\n\n')
    : '(Δεν βρέθηκε σχετικό υλικό στα σχολικά βιβλία - απάντησε με τις γενικές σου γνώσεις)'

  const sourcesList = context.length > 0
    ? context.map((chunk, i) => {
        const bookName = getBookName(chunk.metadata?.source_file || '')
        return `Πηγή ${i + 1}: ${bookName}`
      }).join('\n')
    : 'Δεν βρέθηκαν σχετικές πηγές.'

  const systemPrompt = `Είσαι ένας έμπειρος Έλληνας καθηγητής που βοηθά μαθητές ΓΥΜΝΑΣΙΟΥ και ΛΥΚΕΙΟΥ να κατανοήσουν τα μαθήματά τους.

${subjectInstruction}

ΣΗΜΑΝΤΙΚΟ - ΕΛΛΗΝΙΚΟ ΕΚΠΑΙΔΕΥΤΙΚΟ ΠΛΑΙΣΙΟ:
Όταν ο μαθητής αναφέρει αυτά τα θεωρήματα, εννοεί τα ΣΧΟΛΙΚΑ θεωρήματα:
- "Θεώρημα Fermat" = Θεώρημα για ΤΟΠΙΚΑ ΑΚΡΟΤΑΤΑ: Αν η f έχει τοπικό ακρότατο στο x₀ και είναι παραγωγίσιμη εκεί, τότε f'(x₀)=0
- "Θεώρημα Bolzano" = Αν f συνεχής στο [α,β] και f(α)·f(β)<0, τότε υπάρχει ρίζα στο (α,β)
- "Θεώρημα Rolle" = Αν f συνεχής στο [α,β], παραγωγίσιμη στο (α,β) και f(α)=f(β), τότε υπάρχει ξ με f'(ξ)=0
ΜΗΝ αναφέρεις το "Μεγάλο Θεώρημα Fermat" (Fermat's Last Theorem) εκτός αν ρωτήσει ρητά για αυτό.

ΟΔΗΓΙΕΣ:
1. Απάντησε ΠΑΝΤΑ στα Ελληνικά
2. ΧΡΗΣΙΜΟΠΟΙΗΣΕ ΤΙΣ ΓΝΩΣΕΙΣ ΣΟΥ για να δώσεις πλήρη και ακριβή απάντηση
3. Όπου το υλικό από τα βιβλία υποστηρίζει την απάντησή σου, ανέφερε "Σύμφωνα με το σχολικό βιβλίο..." ή "Όπως αναφέρεται στο [Πηγή X]..."
4. Αν το υλικό έχει επιπλέον λεπτομέρειες ή παραδείγματα, συμπερίλαβέ τα
5. Εξήγησε με απλό και κατανοητό τρόπο, κατάλληλο για μαθητή
6. Δώσε παραδείγματα όπου είναι χρήσιμο
7. Ενθάρρυνε τον μαθητή να ρωτήσει περισσότερα

ΔΙΑΘΕΣΙΜΕΣ ΠΗΓΕΣ:
${sourcesList}

ΥΛΙΚΟ ΑΠΟ ΣΧΟΛΙΚΑ ΒΙΒΛΙΑ:
${contextText}

ΣΗΜΑΝΤΙΚΟ: Δώσε πάντα μια πλήρη, εκπαιδευτική απάντηση. Μην λες "δεν βρήκα στα βιβλία" - αντί αυτού, απάντησε με τις γνώσεις σου και συμπλήρωσε από τα βιβλία όπου είναι δυνατόν.`

  // Build messages with history
  const messages = [
    ...history.slice(-6),
    { role: 'user' as const, content: question }
  ]

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: systemPrompt,
    messages,
  })

  return (response.content[0] as any).text
}

export async function POST(request: NextRequest) {
  try {
    const { message, subject: providedSubject, history = [] } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    // Detect subject
    const detectedSubject = providedSubject || detectSubject(message, history)

    // Expand query
    const expandedQuery = await expandQuery(message, detectedSubject, history)

    // Search corpus
    const results = await searchCorpus(expandedQuery, detectedSubject)

    // Generate answer
    const answer = await generateAnswer(message, results, detectedSubject, history)

    // Transform sources for response with clean book names
    const sources = results.map((r: any) => ({
      ...r,
      bookName: getBookName(r.metadata?.source_file || ''),
    }))

    return NextResponse.json({
      answer,
      sources,
      detected_subject: detectedSubject,
      expanded_query: expandedQuery,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
