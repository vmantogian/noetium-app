'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

/**
 * OPTION 2: "SMART & QUICK" - Minimal, Intelligent Onboarding
 * 
 * Philosophy: Get students started in under 60 seconds
 * Best for: Older students (Lyceum), returning users, or as the default option
 * 
 * Flow:
 * 1. Single screen with all essential info
 * 2. AI Personalization loading screen
 * 3. Dashboard redirect
 */

const GRADE_MAPPING: Record<number, { grade: string; displayName: string }> = {
  2018: { grade: 'primary_1', displayName: 'Α\' Δημοτικού' },
  2017: { grade: 'primary_2', displayName: 'Β\' Δημοτικού' },
  2016: { grade: 'primary_3', displayName: 'Γ\' Δημοτικού' },
  2015: { grade: 'primary_4', displayName: 'Δ\' Δημοτικού' },
  2014: { grade: 'primary_5', displayName: 'Ε\' Δημοτικού' },
  2013: { grade: 'primary_6', displayName: 'ΣΤ\' Δημοτικού' },
  2012: { grade: 'gymnasium_1', displayName: 'Α\' Γυμνασίου' },
  2011: { grade: 'gymnasium_2', displayName: 'Β\' Γυμνασίου' },
  2010: { grade: 'gymnasium_3', displayName: 'Γ\' Γυμνασίου' },
  2009: { grade: 'lyceum_1', displayName: 'Α\' Λυκείου' },
  2008: { grade: 'lyceum_2', displayName: 'Β\' Λυκείου' },
  2007: { grade: 'lyceum_3', displayName: 'Γ\' Λυκείου' },
};

const SUBJECTS = [
  { id: 'mathematics', name: 'Μαθηματικά', icon: '🔢' },
  { id: 'greek_lang', name: 'Γλώσσα', icon: '📖' },
  { id: 'ancient_greek', name: 'Αρχαία', icon: '🏛️' },
  { id: 'history', name: 'Ιστορία', icon: '📜' },
  { id: 'physics', name: 'Φυσική', icon: '⚡' },
  { id: 'chemistry', name: 'Χημεία', icon: '🧪' },
  { id: 'biology', name: 'Βιολογία', icon: '🧬' },
  { id: 'geography', name: 'Γεωγραφία', icon: '🗺️' },
  { id: 'english', name: 'Αγγλικά', icon: '🇬🇧' },
  { id: 'art', name: 'Εικαστικά', icon: '🎨' },
  { id: 'music', name: 'Μουσική', icon: '🎵' },
  { id: 'ict', name: 'Πληροφορική', icon: '💻' },
];

export default function SmartQuickOnboarding() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [personalizing, setPersonalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gradeInfo = birthYear ? GRADE_MAPPING[birthYear] : null;
  const years = Object.keys(GRADE_MAPPING).map(Number).sort((a, b) => b - a);

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('No user found');
      if (!gradeInfo) throw new Error('Invalid grade');

      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          name: `${firstName} ${lastName}`,
          grade: gradeInfo.grade,
          grade_level: gradeInfo.grade,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Create student profile
      const { error: studentError } = await supabase
        .from('student_profiles')
        .upsert({
          user_id: user.id,
          grade: gradeInfo.grade,
          favorite_subjects: selectedSubjects,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        });

      if (studentError) throw studentError;

      // Create portfolio (ignore if already exists)
      const { error: portfolioError } = await supabase
        .from('portfolios')
        .insert({
          student_id: user.id,
          grade_level: gradeInfo.grade,
        });

      if (portfolioError && portfolioError.code !== '23505') {
        // Only throw if it's not a duplicate key error
        console.warn('Portfolio creation warning:', portfolioError);
      }

      // Show personalization screen
      setPersonalizing(true);
      
      // Redirect to student dashboard after animation
      setTimeout(() => {
        router.push('/student');
      }, 2500);

    } catch (err) {
      console.error('Onboarding error:', err);
      setError('Κάτι πήγε στραβά. Δοκίμασε ξανά.');
      setLoading(false);
    }
  };

  const canSubmit = firstName.trim() && lastName.trim() && birthYear && selectedSubjects.length > 0;

  // Personalization loading screen
  if (personalizing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2A50DF] via-[#25A1B0] to-[#D9325C] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-12 w-full max-w-2xl shadow-2xl text-center">
          <div className="text-7xl mb-6">🤖</div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ετοιμάζουμε το περιβάλλον σου...
          </h2>
          
          <div className="space-y-4 mb-8 text-left">
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-6 h-6 border-2 border-[#2A50DF] border-t-transparent rounded-full animate-spin"></div>
              <span>Συγχρονίζουμε την ύλη για την {gradeInfo?.displayName}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-6 h-6 border-2 border-[#2A50DF] border-t-transparent rounded-full animate-spin" style={{ animationDelay: '0.2s' }}></div>
              <span>Φορτώνουμε τα βιβλία σου</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-6 h-6 border-2 border-[#2A50DF] border-t-transparent rounded-full animate-spin" style={{ animationDelay: '0.4s' }}></div>
              <span>Προετοιμάζουμε εξατομικευμένες προτάσεις</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-6 h-6 border-2 border-[#2A50DF] border-t-transparent rounded-full animate-spin" style={{ animationDelay: '0.6s' }}></div>
              <span>Ρυθμίζουμε τον Νους να σε καταλαβαίνει</span>
            </div>
          </div>

          <p className="text-gray-500 text-sm">
            Θα είμαστε έτοιμοι σε λίγα δευτερόλεπτα...
          </p>
        </div>
      </div>
    );
  }

  // Main onboarding form
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2A50DF] via-[#25A1B0] to-[#D9325C] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-3xl shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👋</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Γεια σου! Ας ξεκινήσουμε
          </h1>
          <p className="text-gray-600">
            Μόνο λίγες πληροφορίες για να προσαρμόσουμε την εμπειρία σου
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Όνομα *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A50DF] focus:border-[#2A50DF] text-gray-900"
                placeholder="π.χ. Μαρία"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Επώνυμο *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A50DF] focus:border-[#2A50DF] text-gray-900"
                placeholder="π.χ. Παπαδοπούλου"
                required
              />
            </div>
          </div>

          {/* Birth Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Έτος γέννησης *
            </label>
            <select
              value={birthYear || ''}
              onChange={(e) => setBirthYear(Number(e.target.value))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A50DF] focus:border-[#2A50DF] text-gray-900"
              required
            >
              <option value="">Επέλεξε έτος γέννησης</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year} - {GRADE_MAPPING[year].displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Grade Confirmation */}
          {gradeInfo && (
            <div className="bg-blue-50 border-2 border-[#2A50DF] rounded-xl p-4 flex items-center gap-3">
              <div className="text-3xl">✅</div>
              <div>
                <p className="text-sm text-gray-600">Βλέπω ότι είσαι στην</p>
                <p className="text-xl font-bold text-[#2A50DF]">
                  {gradeInfo.displayName}
                </p>
              </div>
            </div>
          )}

          {/* Subject Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Ποια μαθήματα σου αρέσουν; * (επέλεξε τουλάχιστον 1)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {SUBJECTS.map((subject) => {
                const isSelected = selectedSubjects.includes(subject.id);
                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => toggleSubject(subject.id)}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      isSelected
                        ? 'border-[#2A50DF] bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{subject.icon}</div>
                    <div className={`text-xs font-medium ${isSelected ? 'text-[#2A50DF]' : 'text-gray-600'}`}>
                      {subject.name}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {selectedSubjects.length} επιλεγμένα
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full py-4 bg-[#2A50DF] text-white text-lg font-semibold rounded-xl hover:bg-[#1E3DB8] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Περίμενε...
              </>
            ) : (
              <>
                Ξεκίνα τη μάθηση! 🚀
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-500">
            Μπορείς να αλλάξεις αυτές τις ρυθμίσεις αργότερα από το προφίλ σου
          </p>
        </form>
      </div>
    </div>
  );
}
