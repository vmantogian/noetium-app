'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Parent Onboarding Flow
 * 
 * Family-focused flow for parents to set up monitoring for their children
 * Collects: parent name, children details, notification preferences
 */

type OnboardingStep = 'welcome' | 'name' | 'children' | 'notifications' | 'complete';

interface Child {
  id: string;
  name: string;
  grade: string;
}

interface ParentData {
  firstName: string;
  lastName: string;
  children: Child[];
  emailNotifications: boolean;
  weeklyReports: boolean;
}

const GRADES = [
  { id: 'primary_1', name: 'Α\' Δημοτικού' },
  { id: 'primary_2', name: 'Β\' Δημοτικού' },
  { id: 'primary_3', name: 'Γ\' Δημοτικού' },
  { id: 'primary_4', name: 'Δ\' Δημοτικού' },
  { id: 'primary_5', name: 'Ε\' Δημοτικού' },
  { id: 'primary_6', name: 'ΣΤ\' Δημοτικού' },
  { id: 'gymnasium_1', name: 'Α\' Γυμνασίου' },
  { id: 'gymnasium_2', name: 'Β\' Γυμνασίου' },
  { id: 'gymnasium_3', name: 'Γ\' Γυμνασίου' },
  { id: 'lyceum_1', name: 'Α\' Λυκείου' },
  { id: 'lyceum_2', name: 'Β\' Λυκείου' },
  { id: 'lyceum_3', name: 'Γ\' Λυκείου' },
];

export default function ParentOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [parentData, setParentData] = useState<ParentData>({
    firstName: '',
    lastName: '',
    children: [],
    emailNotifications: true,
    weeklyReports: true,
  });
  const [currentChildName, setCurrentChildName] = useState('');
  const [currentChildGrade, setCurrentChildGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    const steps: OnboardingStep[] = ['welcome', 'name', 'children', 'notifications', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: OnboardingStep[] = ['welcome', 'name', 'children', 'notifications', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const addChild = () => {
    if (currentChildName.trim() && currentChildGrade) {
      setParentData(prev => ({
        ...prev,
        children: [
          ...prev.children,
          {
            id: Date.now().toString(),
            name: currentChildName.trim(),
            grade: currentChildGrade,
          }
        ]
      }));
      setCurrentChildName('');
      setCurrentChildGrade('');
    }
  };

  const removeChild = (id: string) => {
    setParentData(prev => ({
      ...prev,
      children: prev.children.filter(child => child.id !== id)
    }));
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('No user found');

      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          name: `${parentData.firstName} ${parentData.lastName}`,
          user_type: 'parent',
          children_grades: parentData.children.map(c => c.grade),
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      handleNext();
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('Κάτι πήγε στραβά. Δοκίμασε ξανά.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'name':
        return parentData.firstName.trim() && parentData.lastName.trim();
      case 'children':
        return parentData.children.length > 0;
      default:
        return true;
    }
  };

  // Welcome Screen
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-2xl shadow-2xl text-center">
          <div className="text-7xl mb-6">👨‍👩‍👧‍👦</div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Καλώς ήρθατε στο Noetium!
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Παρακολουθήστε την πρόοδο των παιδιών σας και υποστηρίξτε τη μαθησιακή τους πορεία με εργαλεία AI.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="text-3xl mb-2">📊</div>
              <p className="text-sm font-medium text-gray-700">Παρακολούθηση Προόδου</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <div className="text-3xl mb-2">🏆</div>
              <p className="text-sm font-medium text-gray-700">Επιτεύγματα</p>
            </div>
            <div className="p-4 bg-pink-50 rounded-xl">
              <div className="text-3xl mb-2">📧</div>
              <p className="text-sm font-medium text-gray-700">Εβδομαδιαίες Αναφορές</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-sm font-medium text-gray-700">Επικοινωνία AI</p>
            </div>
          </div>

          <button
            onClick={handleNext}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Ας ξεκινήσουμε! →
          </button>
        </div>
      </div>
    );
  }

  // Name Screen
  if (step === 'name') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-2xl shadow-2xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Πώς σας λένε;
          </h2>
          <p className="text-gray-600 mb-8 text-center">
            Χαίρομαι που σας γνωρίζω!
          </p>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Όνομα
              </label>
              <input
                type="text"
                value={parentData.firstName}
                onChange={(e) => setParentData({ ...parentData, firstName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-gray-900"
                placeholder="π.χ. Γιώργος"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Επώνυμο
              </label>
              <input
                type="text"
                value={parentData.lastName}
                onChange={(e) => setParentData({ ...parentData, lastName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-gray-900"
                placeholder="π.χ. Παπαδόπουλος"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Πίσω
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Συνέχεια →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Children Screen
  if (step === 'children') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-2xl shadow-2xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Τα παιδιά σας
          </h2>
          <p className="text-gray-600 mb-8 text-center">
            Προσθέστε τα παιδιά που θέλετε να παρακολουθείτε
          </p>

          {/* Add Child Form */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Όνομα Παιδιού
                </label>
                <input
                  type="text"
                  value={currentChildName}
                  onChange={(e) => setCurrentChildName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="π.χ. Μαρία"
                  onKeyPress={(e) => e.key === 'Enter' && addChild()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Τάξη
                </label>
                <select
                  value={currentChildGrade}
                  onChange={(e) => setCurrentChildGrade(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Επιλέξτε τάξη</option>
                  {GRADES.map(grade => (
                    <option key={grade.id} value={grade.id}>{grade.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={addChild}
              disabled={!currentChildName.trim() || !currentChildGrade}
              className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Προσθήκη Παιδιού
            </button>
          </div>

          {/* Children List */}
          {parentData.children.length > 0 && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-700 mb-3">Τα Παιδιά μου:</h3>
              <div className="space-y-2">
                {parentData.children.map((child) => {
                  const gradeName = GRADES.find(g => g.id === child.grade)?.name || child.grade;
                  return (
                    <div
                      key={child.id}
                      className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">👦</span>
                        <div>
                          <p className="font-medium text-gray-800">{child.name}</p>
                          <p className="text-sm text-gray-500">{gradeName}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeChild(child.id)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {parentData.children.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p>Δεν έχετε προσθέσει ακόμα παιδιά</p>
              <p className="text-sm mt-1">Προσθέστε τουλάχιστον ένα παιδί για να συνεχίσετε</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Πίσω
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Συνέχεια →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Notifications Screen
  if (step === 'notifications') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-2xl shadow-2xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Ειδοποιήσεις
          </h2>
          <p className="text-gray-600 mb-8 text-center">
            Πώς θέλετε να ενημερώνεστε;
          </p>

          <div className="space-y-4 mb-8">
            <div className="p-5 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
              <label className="flex items-start gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={parentData.emailNotifications}
                  onChange={(e) => setParentData({ ...parentData, emailNotifications: e.target.checked })}
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">📧</span>
                    <p className="font-semibold text-gray-800">Email Ειδοποιήσεις</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Λάβετε ειδοποιήσεις όταν τα παιδιά σας ολοκληρώνουν δραστηριότητες ή κερδίζουν badges
                  </p>
                </div>
              </label>
            </div>

            <div className="p-5 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
              <label className="flex items-start gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={parentData.weeklyReports}
                  onChange={(e) => setParentData({ ...parentData, weeklyReports: e.target.checked })}
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">📊</span>
                    <p className="font-semibold text-gray-800">Εβδομαδιαίες Αναφορές</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Λάβετε μια σύνοψη της εβδομαδιαίας προόδου κάθε Κυριακή
                  </p>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleBack}
              disabled={loading}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Πίσω
            </button>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Περίμενε...
                </>
              ) : (
                'Ολοκλήρωση! ✨'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Complete Screen
  if (step === 'complete') {
    setTimeout(() => {
      router.push('/parent');
    }, 3000);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-2xl shadow-2xl text-center">
          <div className="text-9xl mb-6 animate-bounce">🎉</div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Είστε έτοιμοι, {parentData.firstName}!
          </h1>
          
          <p className="text-xl text-gray-600 mb-4">
            Το περιβάλλον γονέα είναι υπό ανάπτυξη.
          </p>
          
          <p className="text-gray-500 mb-8">
            Σύντομα θα μπορείτε να παρακολουθείτε την πρόοδο {parentData.children.length === 1 ? 'του παιδιού σας' : 'των παιδιών σας'}!
          </p>

          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return null;
}
