'use client';

import { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import Link from 'next/link';

// ============================================
// TYPES
// ============================================

interface CodeBlock {
  id: string;
  type: 'action' | 'loop' | 'condition' | 'variable';
  content: string;
  contentEl: string;
  color: string;
}

interface Puzzle {
  id: string;
  title: string;
  titleEl: string;
  description: string;
  descriptionEl: string;
  difficulty: 'easy' | 'medium' | 'hard';
  availableBlocks: CodeBlock[];
  correctSequence: string[];
  hint: string;
  concept: string;
}

interface NewBadge {
  id: string;
  name: string;
  name_el: string;
  icon: string;
}

// ============================================
// PUZZLE DATA
// ============================================

const puzzles: Puzzle[] = [
  {
    id: 'sequence-1',
    title: 'Morning Routine',
    titleEl: 'Πρωινή Ρουτίνα',
    description: 'Put the morning routine steps in the correct order',
    descriptionEl: 'Βάλε τα βήματα της πρωινής ρουτίνας στη σωστή σειρά',
    difficulty: 'easy',
    concept: 'Ακολουθία (Sequence)',
    hint: 'Σκέψου τι κάνεις πρώτα όταν ξυπνάς!',
    availableBlocks: [
      { id: 'b1', type: 'action', content: 'Eat breakfast', contentEl: 'Φάε πρωινό', color: 'bg-green-400' },
      { id: 'b2', type: 'action', content: 'Wake up', contentEl: 'Ξύπνα', color: 'bg-blue-400' },
      { id: 'b3', type: 'action', content: 'Go to school', contentEl: 'Πήγαινε σχολείο', color: 'bg-purple-400' },
      { id: 'b4', type: 'action', content: 'Get dressed', contentEl: 'Ντύσου', color: 'bg-orange-400' },
    ],
    correctSequence: ['b2', 'b4', 'b1', 'b3'],
  },
  {
    id: 'loop-1',
    title: 'Draw a Square',
    titleEl: 'Σχεδίασε Τετράγωνο',
    description: 'Use a loop to draw a square efficiently',
    descriptionEl: 'Χρησιμοποίησε επανάληψη για να σχεδιάσεις τετράγωνο',
    difficulty: 'easy',
    concept: 'Επανάληψη (Loop)',
    hint: 'Ένα τετράγωνο έχει 4 πλευρές. Τι επαναλαμβάνεται;',
    availableBlocks: [
      { id: 'l1', type: 'loop', content: 'Repeat 4 times', contentEl: 'Επανάλαβε 4 φορές', color: 'bg-yellow-400' },
      { id: 'l2', type: 'action', content: 'Move forward', contentEl: 'Προχώρα μπροστά', color: 'bg-blue-400' },
      { id: 'l3', type: 'action', content: 'Turn right 90°', contentEl: 'Στρίψε δεξιά 90°', color: 'bg-green-400' },
      { id: 'l4', type: 'action', content: 'End repeat', contentEl: 'Τέλος επανάληψης', color: 'bg-yellow-400' },
    ],
    correctSequence: ['l1', 'l2', 'l3', 'l4'],
  },
  {
    id: 'condition-1',
    title: 'Umbrella Decision',
    titleEl: 'Απόφαση για Ομπρέλα',
    description: 'Use a condition to decide whether to take an umbrella',
    descriptionEl: 'Χρησιμοποίησε συνθήκη για να αποφασίσεις αν θα πάρεις ομπρέλα',
    difficulty: 'medium',
    concept: 'Συνθήκη (If-Then)',
    hint: 'Πότε χρειαζόμαστε ομπρέλα;',
    availableBlocks: [
      { id: 'c1', type: 'condition', content: 'If raining', contentEl: 'Αν βρέχει', color: 'bg-cyan-400' },
      { id: 'c2', type: 'action', content: 'Take umbrella', contentEl: 'Πάρε ομπρέλα', color: 'bg-blue-400' },
      { id: 'c3', type: 'condition', content: 'Else', contentEl: 'Αλλιώς', color: 'bg-cyan-400' },
      { id: 'c4', type: 'action', content: 'Wear sunglasses', contentEl: 'Φόρεσε γυαλιά', color: 'bg-orange-400' },
      { id: 'c5', type: 'condition', content: 'End if', contentEl: 'Τέλος αν', color: 'bg-cyan-400' },
    ],
    correctSequence: ['c1', 'c2', 'c3', 'c4', 'c5'],
  },
  {
    id: 'variable-1',
    title: 'Count Apples',
    titleEl: 'Μέτρα τα Μήλα',
    description: 'Use a variable to count apples',
    descriptionEl: 'Χρησιμοποίησε μεταβλητή για να μετρήσεις μήλα',
    difficulty: 'medium',
    concept: 'Μεταβλητή (Variable)',
    hint: 'Η μεταβλητή είναι σαν ένα κουτί που κρατάει αριθμούς!',
    availableBlocks: [
      { id: 'v1', type: 'variable', content: 'Set apples = 0', contentEl: 'Θέσε μήλα = 0', color: 'bg-pink-400' },
      { id: 'v2', type: 'loop', content: 'Repeat 5 times', contentEl: 'Επανάλαβε 5 φορές', color: 'bg-yellow-400' },
      { id: 'v3', type: 'variable', content: 'Add 1 to apples', contentEl: 'Πρόσθεσε 1 στα μήλα', color: 'bg-pink-400' },
      { id: 'v4', type: 'action', content: 'End repeat', contentEl: 'Τέλος επανάληψης', color: 'bg-yellow-400' },
      { id: 'v5', type: 'action', content: 'Show apples', contentEl: 'Εμφάνισε μήλα', color: 'bg-green-400' },
    ],
    correctSequence: ['v1', 'v2', 'v3', 'v4', 'v5'],
  },
  {
    id: 'sequence-2',
    title: 'Make a Sandwich',
    titleEl: 'Φτιάξε Σάντουιτς',
    description: 'Arrange the steps to make a sandwich',
    descriptionEl: 'Βάλε τα βήματα στη σειρά για να φτιάξεις σάντουιτς',
    difficulty: 'easy',
    concept: 'Ακολουθία (Sequence)',
    hint: 'Ξεκίνα με το ψωμί!',
    availableBlocks: [
      { id: 's1', type: 'action', content: 'Add cheese', contentEl: 'Βάλε τυρί', color: 'bg-yellow-400' },
      { id: 's2', type: 'action', content: 'Put bread slice', contentEl: 'Βάλε φέτα ψωμί', color: 'bg-orange-400' },
      { id: 's3', type: 'action', content: 'Add ham', contentEl: 'Βάλε ζαμπόν', color: 'bg-pink-400' },
      { id: 's4', type: 'action', content: 'Close with bread', contentEl: 'Κλείσε με ψωμί', color: 'bg-orange-400' },
    ],
    correctSequence: ['s2', 's1', 's3', 's4'],
  },
];

// ============================================
// BADGE CELEBRATION
// ============================================

function BadgeCelebration({ badges, onClose }: { badges: NewBadge[]; onClose: () => void }) {
  if (badges.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full text-center"
      >
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Νέο Badge!</h2>
        <div className="space-y-3 mb-6">
          {badges.map((badge) => (
            <div key={badge.id} className="bg-blue-50 rounded-xl p-4">
              <span className="text-4xl">{badge.icon}</span>
              <p className="font-semibold text-blue-700 mt-2">{badge.name_el || badge.name}</p>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium">
          Τέλεια! 🚀
        </button>
      </motion.div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CodingPuzzlesPage() {
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [userSequence, setUserSequence] = useState<CodeBlock[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [completedPuzzles, setCompletedPuzzles] = useState<Set<string>>(new Set());
  const [newBadges, setNewBadges] = useState<NewBadge[]>([]);

  const currentPuzzle = puzzles[currentPuzzleIndex];

  useEffect(() => {
    // Reset when puzzle changes
    setUserSequence([...currentPuzzle.availableBlocks].sort(() => Math.random() - 0.5));
    setIsCorrect(null);
    setShowHint(false);
  }, [currentPuzzleIndex]);

  const checkSolution = async () => {
    const userIds = userSequence.map(b => b.id);
    const correct = JSON.stringify(userIds) === JSON.stringify(currentPuzzle.correctSequence);
    setIsCorrect(correct);

    if (correct && !completedPuzzles.has(currentPuzzle.id)) {
      // Save progress
      try {
        const response = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            feature: 'cs-ai',
            activity_type: 'coding_puzzle',
            activity_id: currentPuzzle.id,
            completed: true,
            metadata: {
              puzzleTitle: currentPuzzle.titleEl,
              concept: currentPuzzle.concept,
              difficulty: currentPuzzle.difficulty
            }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.newBadges?.length > 0) {
            setNewBadges(data.newBadges);
          }
          setCompletedPuzzles(prev => new Set([...prev, currentPuzzle.id]));
        }
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    }
  };

  const nextPuzzle = () => {
    if (currentPuzzleIndex < puzzles.length - 1) {
      setCurrentPuzzleIndex(prev => prev + 1);
    }
  };

  const prevPuzzle = () => {
    if (currentPuzzleIndex > 0) {
      setCurrentPuzzleIndex(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <BadgeCelebration badges={newBadges} onClose={() => setNewBadges([])} />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/cs-ai" className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-block">
            ← Πίσω στην Πληροφορική
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">🧩 Block Coding Puzzles</h1>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {puzzles.map((puzzle, index) => (
            <button
              key={puzzle.id}
              onClick={() => setCurrentPuzzleIndex(index)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                completedPuzzles.has(puzzle.id)
                  ? 'bg-green-500 text-white'
                  : index === currentPuzzleIndex
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {completedPuzzles.has(puzzle.id) ? '✓' : index + 1}
            </button>
          ))}
        </div>

        {/* Puzzle Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          {/* Puzzle Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                currentPuzzle.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                currentPuzzle.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {currentPuzzle.difficulty === 'easy' ? 'Εύκολο' : 
                 currentPuzzle.difficulty === 'medium' ? 'Μέτριο' : 'Δύσκολο'}
              </span>
              <h2 className="text-xl font-bold text-gray-800 mt-2">{currentPuzzle.titleEl}</h2>
              <p className="text-gray-600">{currentPuzzle.descriptionEl}</p>
            </div>
            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
              {currentPuzzle.concept}
            </span>
          </div>

          {/* Blocks Area */}
          <div className="bg-gray-50 rounded-xl p-4 min-h-[200px]">
            <p className="text-sm text-gray-500 mb-3">Σύρε τα blocks στη σωστή σειρά:</p>
            
            <Reorder.Group
              axis="y"
              values={userSequence}
              onReorder={setUserSequence}
              className="space-y-2"
            >
              {userSequence.map((block) => (
                <Reorder.Item
                  key={block.id}
                  value={block}
                  className={`${block.color} p-4 rounded-xl cursor-grab active:cursor-grabbing shadow-sm flex items-center gap-3`}
                >
                  <span className="text-white text-xl">
                    {block.type === 'action' ? '▶️' :
                     block.type === 'loop' ? '🔄' :
                     block.type === 'condition' ? '❓' : '📦'}
                  </span>
                  <span className="text-white font-medium">{block.contentEl}</span>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>

          {/* Hint */}
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4"
            >
              <p className="text-yellow-800">💡 {currentPuzzle.hint}</p>
            </motion.div>
          )}

          {/* Result */}
          {isCorrect !== null && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-4 rounded-xl ${
                isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}
            >
              {isCorrect ? (
                <div className="text-center">
                  <p className="text-green-800 text-xl mb-2">🎉 Σωστά!</p>
                  <p className="text-green-600">Κατάλαβες την έννοια: {currentPuzzle.concept}</p>
                </div>
              ) : (
                <p className="text-red-800">❌ Δεν είναι σωστή η σειρά. Δοκίμασε ξανά!</p>
              )}
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowHint(true)}
              disabled={showHint}
              className={`px-4 py-2 rounded-xl font-medium ${
                showHint ? 'bg-gray-200 text-gray-400' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              💡 Hint
            </button>
            <button
              onClick={checkSolution}
              className="flex-1 bg-blue-500 text-white py-2 rounded-xl font-medium hover:bg-blue-600"
            >
              ✓ Έλεγξε
            </button>
            {isCorrect && currentPuzzleIndex < puzzles.length - 1 && (
              <button
                onClick={nextPuzzle}
                className="px-4 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600"
              >
                Επόμενο →
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevPuzzle}
            disabled={currentPuzzleIndex === 0}
            className={`px-4 py-2 rounded-xl ${
              currentPuzzleIndex === 0 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            ← Προηγούμενο
          </button>
          <button
            onClick={nextPuzzle}
            disabled={currentPuzzleIndex === puzzles.length - 1}
            className={`px-4 py-2 rounded-xl ${
              currentPuzzleIndex === puzzles.length - 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Επόμενο →
          </button>
        </div>
      </div>
    </div>
  );
}
