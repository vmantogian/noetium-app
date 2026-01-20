'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface GradingResult {
  score: number;
  maxScore: number;
  feedback: string;
  details: {
    criterion: string;
    score: number;
    maxScore: number;
    comment: string;
  }[];
  suggestions: string[];
}

const gradingScales = [
  { id: '10', name: '0-10', max: 10 },
  { id: '20', name: '0-20', max: 20 },
  { id: '100', name: '0-100', max: 100 },
  { id: 'letter', name: 'A-F', max: 0 },
];

const subjectOptions = [
  'Μαθηματικά', 'Φυσική', 'Χημεία', 'Βιολογία',
  'Νεοελληνική Γλώσσα', 'Έκθεση', 'Αρχαία Ελληνικά', 'Ιστορία',
];

export default function PhotoGraderPage() {
  const [step, setStep] = useState(1);
  const [image, setImage] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [gradingScale, setGradingScale] = useState('10');
  const [rubric, setRubric] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setStep(2);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setStep(2);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const gradeAssignment = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Demo result
    setResult({
      score: 8,
      maxScore: 10,
      feedback: 'Πολύ καλή εργασία! Ο μαθητής επιδεικνύει σωστή κατανόηση της μεθόδου επίλυσης εξισώσεων. Υπάρχουν μικρά λάθη στην απλοποίηση που μπορούν να διορθωθούν με περισσότερη εξάσκηση.',
      details: [
        { criterion: 'Κατανόηση προβλήματος', score: 2, maxScore: 2, comment: 'Άριστη κατανόηση του ζητούμενου' },
        { criterion: 'Μεθοδολογία επίλυσης', score: 2, maxScore: 3, comment: 'Σωστή προσέγγιση, μικρό λάθος στο βήμα 3' },
        { criterion: 'Υπολογισμοί', score: 2, maxScore: 2, comment: 'Ακριβείς υπολογισμοί' },
        { criterion: 'Παρουσίαση', score: 1, maxScore: 2, comment: 'Θα μπορούσε να είναι πιο καθαρή' },
        { criterion: 'Τελική απάντηση', score: 1, maxScore: 1, comment: 'Σωστή τελική απάντηση' },
      ],
      suggestions: [
        'Προσοχή στην απλοποίηση κλασμάτων',
        'Να ελέγχει τις πράξεις στο τέλος',
        'Να γράφει πιο καθαρά τους αριθμούς',
      ],
    });
    
    setStep(3);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/teacher" className="text-gray-400 hover:text-gray-600">
                ← Πίσω
              </Link>
              <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">📸</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-gray-800">Βαθμολόγηση από Φωτό</h1>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Νέο
                  </span>
                </div>
                <p className="text-sm text-gray-500">Photo Grader</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="bg-pink-100 rounded-2xl p-8 mb-8 text-center">
          <span className="text-4xl">📸</span>
          <h2 className="text-2xl font-bold text-gray-800 mt-4">Βαθμολόγηση από Φωτό</h2>
          <p className="text-gray-600 mt-2">
            Βαθμολογήστε εργασίες από φωτογραφία με AI ανάλυση
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Upload Image */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-6">
                Ανεβάστε φωτογραφία της εργασίας
              </h3>

              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <span className="text-5xl">📷</span>
                <p className="text-gray-600 mt-4">
                  Σύρετε μια εικόνα εδώ ή κάντε κλικ για επιλογή
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Υποστηρίζονται: JPG, PNG, HEIC
                </p>
              </div>

              {/* Mobile Camera Button */}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 flex items-center justify-center gap-2"
                >
                  <span>📸</span>
                  Τράβηξε Φωτό
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
                >
                  <span>🖼️</span>
                  Επιλογή από Συσκευή
                </button>
              </div>

              {/* Tips */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm font-medium text-blue-800 mb-2">💡 Συμβουλές για καλύτερα αποτελέσματα:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Βεβαιωθείτε ότι η εικόνα είναι καθαρή και ευανάγνωστη</li>
                  <li>• Αποφύγετε σκιές και αντανακλάσεις</li>
                  <li>• Φωτογραφίστε από πάνω, κάθετα στο χαρτί</li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* Step 2: Configure Grading */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Image Preview */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Προεπισκόπηση</h3>
                  <button 
                    onClick={() => { setImage(null); setStep(1); }}
                    className="text-pink-600 hover:underline"
                  >
                    Αλλαγή εικόνας
                  </button>
                </div>
                {image && (
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <img 
                      src={image} 
                      alt="Uploaded assignment" 
                      className="w-full max-h-96 object-contain bg-gray-100"
                    />
                  </div>
                )}
              </div>

              {/* Grading Settings */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">
                  Ρυθμίσεις Βαθμολόγησης
                </h3>

                {/* Subject */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Μάθημα *
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">Επιλέξτε μάθημα...</option>
                    {subjectOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Grading Scale */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Κλίμακα Βαθμολόγησης
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {gradingScales.map(scale => (
                      <button
                        key={scale.id}
                        onClick={() => setGradingScale(scale.id)}
                        className={`p-3 rounded-xl text-center transition-all ${
                          gradingScale === scale.id
                            ? 'bg-pink-100 ring-2 ring-pink-500'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <p className="font-medium">{scale.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rubric */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Κριτήρια Βαθμολόγησης (προαιρετικό)
                  </label>
                  <textarea
                    value={rubric}
                    onChange={(e) => setRubric(e.target.value)}
                    placeholder="π.χ. Σωστή μέθοδος επίλυσης (3 μονάδες), Ακριβείς υπολογισμοί (4 μονάδες), Σωστή απάντηση (3 μονάδες)"
                    rows={3}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                  />
                </div>

                {/* Grade Button */}
                <button
                  onClick={gradeAssignment}
                  disabled={loading || !subject}
                  className={`w-full py-3 rounded-xl font-medium transition-all ${
                    loading
                      ? 'bg-gray-300 cursor-wait'
                      : !subject
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-pink-600 text-white hover:bg-pink-700'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        🔍
                      </motion.span>
                      Ανάλυση εργασίας...
                    </span>
                  ) : (
                    '✨ Βαθμολόγηση'
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Results */}
          {step === 3 && result && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Score Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Αποτέλεσμα</h3>
                  <button 
                    onClick={() => setStep(2)}
                    className="text-pink-600 hover:underline"
                  >
                    ← Πίσω
                  </button>
                </div>

                {/* Score */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-baseline gap-2">
                    <span className="text-6xl font-bold text-pink-600">{result.score}</span>
                    <span className="text-2xl text-gray-400">/ {result.maxScore}</span>
                  </div>
                  <p className="text-gray-500 mt-2">
                    {((result.score / result.maxScore) * 100).toFixed(0)}%
                  </p>
                </div>

                {/* Overall Feedback */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="font-medium text-gray-700 mb-2">📝 Γενική Αξιολόγηση</p>
                  <p className="text-gray-600">{result.feedback}</p>
                </div>

                {/* Detailed Breakdown */}
                <div className="space-y-3">
                  <p className="font-medium text-gray-700">📊 Αναλυτική Βαθμολόγηση</p>
                  {result.details.map((detail, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{detail.criterion}</span>
                        <span className={`font-bold ${
                          detail.score === detail.maxScore ? 'text-green-600' :
                          detail.score >= detail.maxScore / 2 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {detail.score}/{detail.maxScore}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{detail.comment}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h4 className="font-medium text-gray-800 mb-4">💡 Προτάσεις Βελτίωσης</h4>
                <ul className="space-y-2">
                  {result.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-600">
                      <span className="text-yellow-500">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h4 className="font-medium text-gray-800 mb-4">Ενέργειες</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 text-center">
                    <span className="text-2xl">📄</span>
                    <p className="text-sm mt-1">Εξαγωγή PDF</p>
                  </button>
                  <button className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 text-center">
                    <span className="text-2xl">📧</span>
                    <p className="text-sm mt-1">Αποστολή</p>
                  </button>
                  <button className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 text-center">
                    <span className="text-2xl">💾</span>
                    <p className="text-sm mt-1">Αποθήκευση</p>
                  </button>
                  <button 
                    onClick={() => { setImage(null); setResult(null); setStep(1); }}
                    className="p-4 bg-pink-50 rounded-xl hover:bg-pink-100 text-center"
                  >
                    <span className="text-2xl">📸</span>
                    <p className="text-sm mt-1">Νέα Εργασία</p>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
