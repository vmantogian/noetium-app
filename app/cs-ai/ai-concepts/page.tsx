'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ============================================
// TYPES
// ============================================

interface Concept {
  id: string;
  title: string;
  titleEl: string;
  icon: string;
  shortDesc: string;
  fullDesc: string;
  example: string;
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

// ============================================
// DATA
// ============================================

const concepts: Concept[] = [
  {
    id: 'what-is-ai',
    title: 'What is AI?',
    titleEl: 'Τι είναι η AI;',
    icon: '🤖',
    shortDesc: 'Μηχανές που μαθαίνουν και σκέφτονται',
    fullDesc: `Η Τεχνητή Νοημοσύνη (AI) είναι η ικανότητα των υπολογιστών να κάνουν πράγματα που συνήθως απαιτούν ανθρώπινη νοημοσύνη.

Αυτό περιλαμβάνει:
• Αναγνώριση εικόνων και προσώπων
• Κατανόηση και παραγωγή γλώσσας
• Λήψη αποφάσεων
• Επίλυση προβλημάτων

Η AI δεν είναι μαγεία - είναι μαθηματικά και δεδομένα που δουλεύουν μαζί!`,
    example: 'Όταν το τηλέφωνό σου ξεκλειδώνει με το πρόσωπό σου, αυτό είναι AI!',
    quiz: {
      question: 'Τι είναι η Τεχνητή Νοημοσύνη;',
      options: [
        'Ένας ρομποτικός άνθρωπος',
        'Υπολογιστές που μαθαίνουν να κάνουν ανθρώπινες εργασίες',
        'Ένα βιντεοπαιχνίδι',
        'Μια μυστική τεχνολογία'
      ],
      correctIndex: 1,
      explanation: 'Η AI είναι υπολογιστές που μαθαίνουν να κάνουν εργασίες που απαιτούν νοημοσύνη!'
    }
  },
  {
    id: 'machine-learning',
    title: 'Machine Learning',
    titleEl: 'Μηχανική Μάθηση',
    icon: '📚',
    shortDesc: 'Πώς οι υπολογιστές μαθαίνουν από δεδομένα',
    fullDesc: `Η Μηχανική Μάθηση είναι ο τρόπος που οι υπολογιστές "μαθαίνουν" χωρίς να τους προγραμματίσουμε για κάθε περίπτωση.

Φαντάσου ότι θες να μάθεις σε έναν υπολογιστή να αναγνωρίζει γάτες:
1. Του δείχνεις χιλιάδες φωτογραφίες γάτων
2. Ο υπολογιστής βρίσκει μοτίβα (αυτιά, μουστάκια, κ.λπ.)
3. Τώρα μπορεί να αναγνωρίσει γάτες σε νέες φωτογραφίες!

Όσο περισσότερα δεδομένα, τόσο καλύτερα μαθαίνει!`,
    example: 'Το YouTube προτείνει βίντεο μαθαίνοντας τι σου αρέσει να βλέπεις.',
    quiz: {
      question: 'Πώς μαθαίνει ο υπολογιστής να αναγνωρίζει γάτες;',
      options: [
        'Του εξηγούμε με λόγια',
        'Του δείχνουμε πολλές φωτογραφίες γάτων',
        'Μαθαίνει μόνος του χωρίς βοήθεια',
        'Διαβάζει βιβλία για γάτες'
      ],
      correctIndex: 1,
      explanation: 'Η μηχανική μάθηση χρειάζεται πολλά παραδείγματα (δεδομένα) για να μάθει!'
    }
  },
  {
    id: 'neural-networks',
    title: 'Neural Networks',
    titleEl: 'Νευρωνικά Δίκτυα',
    icon: '🧠',
    shortDesc: 'Τεχνητοί εγκέφαλοι',
    fullDesc: `Τα Νευρωνικά Δίκτυα είναι εμπνευσμένα από τον ανθρώπινο εγκέφαλο!

Ο εγκέφαλός μας έχει δισεκατομμύρια νευρώνες που συνδέονται μεταξύ τους. Τα τεχνητά νευρωνικά δίκτυα λειτουργούν παρόμοια:

• Έχουν "νευρώνες" (μαθηματικές συναρτήσεις)
• Συνδέονται σε "στρώματα"
• Οι πληροφορίες περνούν από στρώμα σε στρώμα
• Κάθε σύνδεση έχει ένα "βάρος" που αλλάζει όσο μαθαίνει

Τα βαθιά νευρωνικά δίκτυα έχουν πολλά στρώματα!`,
    example: 'Το ChatGPT χρησιμοποιεί τεράστια νευρωνικά δίκτυα με δισεκατομμύρια παραμέτρους!',
    quiz: {
      question: 'Από τι είναι εμπνευσμένα τα νευρωνικά δίκτυα;',
      options: [
        'Από τους υπολογιστές',
        'Από τον ανθρώπινο εγκέφαλο',
        'Από τα δίκτυα του internet',
        'Από τα κοινωνικά δίκτυα'
      ],
      correctIndex: 1,
      explanation: 'Τα νευρωνικά δίκτυα μιμούνται τον τρόπο που λειτουργεί ο εγκέφαλός μας!'
    }
  },
  {
    id: 'chatgpt',
    title: 'ChatGPT & LLMs',
    titleEl: 'ChatGPT & Μεγάλα Γλωσσικά Μοντέλα',
    icon: '💬',
    shortDesc: 'Πώς μιλάει η AI',
    fullDesc: `Τα Μεγάλα Γλωσσικά Μοντέλα (LLMs) όπως το ChatGPT είναι AI που καταλαβαίνουν και παράγουν κείμενο.

Πώς λειτουργούν:
1. Εκπαιδεύονται με τεράστιες ποσότητες κειμένου (βιβλία, ιστοσελίδες, κ.λπ.)
2. Μαθαίνουν μοτίβα στη γλώσσα
3. Προβλέπουν ποια λέξη πρέπει να έρθει μετά

Δεν "σκέφτονται" όπως εμείς - απλά είναι πολύ καλά στο να προβλέπουν κείμενο!

Σημαντικό: Μπορεί να κάνουν λάθη, γι' αυτό πάντα ελέγχουμε τις απαντήσεις τους.`,
    example: 'Όταν ρωτάς το ChatGPT κάτι, προβλέπει λέξη-λέξη τι θα γράψει!',
    quiz: {
      question: 'Πώς δημιουργεί κείμενο το ChatGPT;',
      options: [
        'Αντιγράφει από το internet',
        'Σκέφτεται όπως άνθρωπος',
        'Προβλέπει ποια λέξη πρέπει να έρθει μετά',
        'Τυχαία διαλέγει λέξεις'
      ],
      correctIndex: 2,
      explanation: 'Τα LLMs είναι πολύ καλά στο να προβλέπουν την επόμενη λέξη!'
    }
  },
  {
    id: 'ai-ethics',
    title: 'AI Ethics',
    titleEl: 'Ηθική της AI',
    icon: '⚖️',
    shortDesc: 'Υπεύθυνη χρήση της AI',
    fullDesc: `Η AI είναι ισχυρή τεχνολογία, γι' αυτό πρέπει να τη χρησιμοποιούμε υπεύθυνα!

Σημαντικά θέματα:
• Μεροληψία: Η AI μπορεί να "μάθει" προκαταλήψεις από τα δεδομένα
• Ιδιωτικότητα: Η AI μπορεί να συλλέξει πολλά προσωπικά δεδομένα
• Αλήθεια: Η AI μπορεί να δημιουργήσει ψεύτικο περιεχόμενο
• Εργασία: Η AI μπορεί να αλλάξει πολλές δουλειές

Είναι σημαντικό να μάθουμε να χρησιμοποιούμε την AI σωστά και ηθικά!`,
    example: 'Αν χρησιμοποιείς AI για εργασία, πρέπει να το αναφέρεις!',
    quiz: {
      question: 'Γιατί είναι σημαντική η ηθική στην AI;',
      options: [
        'Δεν είναι σημαντική',
        'Για να φαίνεται πιο έξυπνη η AI',
        'Για να αποφύγουμε προβλήματα όπως μεροληψία και ψέματα',
        'Για να γίνει πιο ακριβή η AI'
      ],
      correctIndex: 2,
      explanation: 'Η AI πρέπει να χρησιμοποιείται υπεύθυνα για να αποφύγουμε προβλήματα!'
    }
  }
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function AIConceptsPage() {
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [completedConcepts, setCompletedConcepts] = useState<Set<string>>(new Set());
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    // Load completed concepts
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/progress?feature=cs-ai');
      if (response.ok) {
        const data = await response.json();
        const completed = data.progress
          ?.filter((p: any) => p.activity_type === 'ai_concept')
          .map((p: any) => p.activity_id) || [];
        setCompletedConcepts(new Set(completed));
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  };

  const handleQuizAnswer = async (index: number) => {
    if (!selectedConcept || quizAnswer !== null) return;
    
    setQuizAnswer(index);
    
    if (index === selectedConcept.quiz.correctIndex && !completedConcepts.has(selectedConcept.id)) {
      // Save progress
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            feature: 'cs-ai',
            activity_type: 'ai_concept',
            activity_id: selectedConcept.id,
            completed: true,
            metadata: { conceptTitle: selectedConcept.titleEl }
          }),
        });
        setCompletedConcepts(prev => new Set([...prev, selectedConcept.id]));
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    }
  };

  const closeConcept = () => {
    setSelectedConcept(null);
    setQuizAnswer(null);
    setShowQuiz(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/cs-ai" className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-block">
            ← Πίσω στην Πληροφορική
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">🤖 Έννοιες AI</h1>
          <p className="text-gray-600">Μάθε πώς λειτουργεί η Τεχνητή Νοημοσύνη</p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Πρόοδος:</span>
            <span className="font-medium text-purple-600">{completedConcepts.size}/{concepts.length}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              style={{ width: `${(completedConcepts.size / concepts.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Concepts Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {concepts.map((concept, index) => (
            <motion.button
              key={concept.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedConcept(concept)}
              className={`bg-white rounded-xl p-5 text-left shadow-sm hover:shadow-md transition-all ${
                completedConcepts.has(concept.id) ? 'ring-2 ring-green-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">{concept.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800">{concept.titleEl}</h3>
                    {completedConcepts.has(concept.id) && (
                      <span className="text-green-500">✓</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{concept.shortDesc}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Concept Modal */}
        <AnimatePresence>
          {selectedConcept && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={closeConcept}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl">{selectedConcept.icon}</span>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedConcept.titleEl}</h2>
                </div>

                {!showQuiz ? (
                  <>
                    {/* Content */}
                    <div className="prose prose-sm max-w-none mb-6">
                      <p className="text-gray-700 whitespace-pre-line">{selectedConcept.fullDesc}</p>
                    </div>

                    {/* Example */}
                    <div className="bg-blue-50 rounded-xl p-4 mb-6">
                      <p className="text-sm text-blue-800">
                        <strong>🎯 Παράδειγμα:</strong> {selectedConcept.example}
                      </p>
                    </div>

                    {/* Quiz Button */}
                    <button
                      onClick={() => setShowQuiz(true)}
                      className="w-full bg-purple-500 text-white py-3 rounded-xl font-medium hover:bg-purple-600"
                    >
                      📝 Κάνε το Quiz!
                    </button>
                  </>
                ) : (
                  <>
                    {/* Quiz */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-800 mb-4">{selectedConcept.quiz.question}</h3>
                      <div className="space-y-2">
                        {selectedConcept.quiz.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuizAnswer(index)}
                            disabled={quizAnswer !== null}
                            className={`w-full p-3 rounded-xl text-left transition-all ${
                              quizAnswer === null
                                ? 'bg-gray-50 hover:bg-gray-100'
                                : index === selectedConcept.quiz.correctIndex
                                ? 'bg-green-100 border-2 border-green-500'
                                : quizAnswer === index
                                ? 'bg-red-100 border-2 border-red-500'
                                : 'bg-gray-50'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quiz Result */}
                    {quizAnswer !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl mb-4 ${
                          quizAnswer === selectedConcept.quiz.correctIndex
                            ? 'bg-green-50'
                            : 'bg-red-50'
                        }`}
                      >
                        <p className={`font-medium ${
                          quizAnswer === selectedConcept.quiz.correctIndex
                            ? 'text-green-800'
                            : 'text-red-800'
                        }`}>
                          {quizAnswer === selectedConcept.quiz.correctIndex ? '🎉 Σωστά!' : '❌ Λάθος!'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{selectedConcept.quiz.explanation}</p>
                      </motion.div>
                    )}

                    <button
                      onClick={closeConcept}
                      className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200"
                    >
                      Κλείσιμο
                    </button>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
