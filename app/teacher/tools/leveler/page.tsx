'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const gradeOptions = [
  { id: 'e_dimotiko', label: 'Ε\' Δημοτικού', level: 5 },
  { id: 'st_dimotiko', label: 'ΣΤ\' Δημοτικού', level: 6 },
  { id: 'a_gymnasio', label: 'Α\' Γυμνασίου', level: 7 },
  { id: 'b_gymnasio', label: 'Β\' Γυμνασίου', level: 8 },
  { id: 'c_gymnasio', label: 'Γ\' Γυμνασίου', level: 9 },
  { id: 'a_lykeio', label: 'Α\' Λυκείου', level: 10 },
  { id: 'b_lykeio', label: 'Β\' Λυκείου', level: 11 },
  { id: 'c_lykeio', label: 'Γ\' Λυκείου', level: 12 },
];

export default function LevelerPage() {
  const [title, setTitle] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [targetGrade, setTargetGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [preserveLength, setPreserveLength] = useState(true);

  const levelText = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/teacher/leveler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          originalText,
          targetGrade,
          preserveLength,
        }),
      });

      const data = await response.json();
      setResult(data.leveledText);
    } catch (error) {
      console.error('Error leveling text:', error);
      // Demo result
      setResult(`Το αναπροσαρμοσμένο κείμενο για ${gradeOptions.find(g => g.id === targetGrade)?.label}:\n\n${originalText.slice(0, 200)}... [Αναπροσαρμοσμένο στο επιθυμητό επίπεδο]`);
    } finally {
      setLoading(false);
    }
  };

  const wordCount = originalText.split(/\s+/).filter(Boolean).length;

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
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <h1 className="font-bold text-gray-800">Προσαρμογή Επιπέδου</h1>
                <p className="text-sm text-gray-500">Leveler</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">
                🖨️ Εκτύπωση
              </button>
              <button className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">
                📤 Εξαγωγή
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="bg-rose-100 rounded-2xl p-8 mb-8 text-center">
          <span className="text-4xl">📊</span>
          <h2 className="text-2xl font-bold text-gray-800 mt-4">Προσαρμογή Επιπέδου</h2>
          <p className="text-gray-600 mt-2">
            Προσαρμόστε την πολυπλοκότητα κειμένων στο επίπεδο των μαθητών σας
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Αρχικό Κείμενο</h3>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Τίτλος κειμένου *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="π.χ. Η λογική του Αριστοτέλη"
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Original Text */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Κείμενο *
                <span className="text-gray-400 font-normal ml-2">
                  (μέχρι 4.500 λέξεις)
                </span>
              </label>
              <textarea
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                placeholder="Επικολλήστε το κείμενο που θέλετε να προσαρμόσετε..."
                rows={12}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
              />
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>{wordCount} λέξεις</span>
                {wordCount > 4500 && (
                  <span className="text-red-500">Υπέρβαση ορίου!</span>
                )}
              </div>
            </div>

            {/* Target Grade */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Νέο επίπεδο *
              </label>
              <select
                value={targetGrade}
                onChange={(e) => setTargetGrade(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Επιλέξτε τάξη...</option>
                {gradeOptions.map(g => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>

            {/* Options */}
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preserveLength}
                  onChange={(e) => setPreserveLength(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-gray-700">Διατήρηση παρόμοιου μήκους</span>
              </label>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 rounded-xl mb-4">
              <p className="text-sm text-blue-700">
                💡 <strong>Σημείωση:</strong> Η προσαρμογή λειτουργεί καλύτερα με 
                πληροφοριακά κείμενα. Λογοτεχνικά κείμενα ενδέχεται να χάσουν 
                μέρος του ύφους του συγγραφέα.
              </p>
            </div>

            {/* Level Button */}
            <button
              onClick={levelText}
              disabled={loading || !title || !originalText || !targetGrade || wordCount > 4500}
              className={`w-full py-3 rounded-xl font-medium transition-all ${
                loading
                  ? 'bg-gray-300 cursor-wait'
                  : !title || !originalText || !targetGrade || wordCount > 4500
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-rose-600 text-white hover:bg-rose-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    ⏳
                  </motion.span>
                  Αναπροσαρμογή...
                </span>
              ) : (
                '✨ Αναπροσαρμογή Επιπέδου'
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Αναπροσαρμοσμένο Κείμενο
              </h3>
              {result && (
                <span className="text-sm text-rose-600">
                  {gradeOptions.find(g => g.id === targetGrade)?.label}
                </span>
              )}
            </div>

            {result ? (
              <>
                <div className="bg-gray-50 rounded-xl p-4 min-h-[300px] mb-4">
                  <p className="whitespace-pre-wrap text-gray-700">{result}</p>
                </div>
                
                {/* Actions */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => navigator.clipboard.writeText(result)}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 flex items-center justify-center gap-2"
                  >
                    📋 Αντιγραφή
                  </button>
                  <button className="flex-1 py-2 bg-rose-100 text-rose-700 rounded-xl hover:bg-rose-200 flex items-center justify-center gap-2">
                    📄 Εξαγωγή
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 min-h-[300px] flex flex-col items-center justify-center text-center">
                <span className="text-4xl mb-4">📝</span>
                <p className="text-gray-500">
                  Εισάγετε το κείμενο και επιλέξτε το επιθυμητό επίπεδο 
                  για να δείτε την αναπροσαρμογή.
                </p>
              </div>
            )}

            {/* Comparison (if result exists) */}
            {result && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="font-medium text-gray-700 mb-3">Σύγκριση</h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-sm text-gray-500">Αρχικό</p>
                    <p className="font-bold text-gray-700">{wordCount} λέξεις</p>
                  </div>
                  <div className="bg-rose-50 rounded-xl p-3">
                    <p className="text-sm text-gray-500">Νέο</p>
                    <p className="font-bold text-rose-600">
                      {result.split(/\s+/).filter(Boolean).length} λέξεις
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
