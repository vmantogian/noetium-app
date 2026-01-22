'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface GradeOption {
  id: string;
  label: string;
  level: string;
}

interface Interest {
  id: string;
  label: string;
  icon: string;
}

const grades: GradeOption[] = [
  { id: 'e_dimotiko', label: 'Ε\' Δημοτικού', level: 'dimotiko' },
  { id: 'st_dimotiko', label: 'ΣΤ\' Δημοτικού', level: 'dimotiko' },
  { id: 'a_gymnasio', label: 'Α\' Γυμνασίου', level: 'gymnasio' },
  { id: 'b_gymnasio', label: 'Β\' Γυμνασίου', level: 'gymnasio' },
  { id: 'c_gymnasio', label: 'Γ\' Γυμνασίου', level: 'gymnasio' },
  { id: 'a_lykeio', label: 'Α\' Λυκείου', level: 'lykeio' },
  { id: 'b_lykeio', label: 'Β\' Λυκείου', level: 'lykeio' },
  { id: 'c_lykeio', label: 'Γ\' Λυκείου', level: 'lykeio' },
];

const interests: Interest[] = [
  { id: 'math', label: 'Μαθηματικά', icon: '🔢' },
  { id: 'science', label: 'Φυσικές Επιστήμες', icon: '🔬' },
  { id: 'literature', label: 'Λογοτεχνία', icon: '📚' },
  { id: 'history', label: 'Ιστορία', icon: '📜' },
  { id: 'art', label: 'Τέχνη', icon: '🎨' },
  { id: 'music', label: 'Μουσική', icon: '🎵' },
  { id: 'coding', label: 'Προγραμματισμός', icon: '💻' },
  { id: 'sports', label: 'Αθλητισμός', icon: '⚽' },
];

const teacherSubjects = [
  { id: 'math', label: 'Μαθηματικά', icon: '🔢' },
  { id: 'physics', label: 'Φυσική', icon: '⚡' },
  { id: 'chemistry', label: 'Χημεία', icon: '🧪' },
  { id: 'biology', label: 'Βιολογία', icon: '🧬' },
  { id: 'greek', label: 'Νεοελληνική Γλώσσα', icon: '📝' },
  { id: 'ancient', label: 'Αρχαία Ελληνικά', icon: '🏛️' },
  { id: 'history', label: 'Ιστορία', icon: '📜' },
  { id: 'english', label: 'Αγγλικά', icon: '🇬🇧' },
  { id: 'cs', label: 'Πληροφορική', icon: '💻' },
  { id: 'other', label: 'Άλλο', icon: '📚' },
];

const goals = [
  { id: 'improve_grades', label: 'Να βελτιώσω τους βαθμούς μου', icon: '📈' },
  { id: 'learn_new', label: 'Να μάθω νέα πράγματα', icon: '💡' },
  { id: 'exam_prep', label: 'Να προετοιμαστώ για εξετάσεις', icon: '📝' },
  { id: 'have_fun', label: 'Να μάθω με διασκέδαση', icon: '🎮' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<'student' | 'teacher' | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [teachingGrades, setTeachingGrades] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Dynamic total steps based on user type
  const totalSteps = userType === 'teacher' ? 4 : 5;

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSubject = (id: string) => {
    setSelectedSubjects(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const toggleTeachingGrade = (id: string) => {
    setTeachingGrades(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('Auth error:', authError);
        router.push('/login');
        return;
      }

      const gradeInfo = grades.find(g => g.id === selectedGrade);

      // Update user profile based on type
      const updateData = userType === 'teacher' ? {
        user_type: 'teacher',
        subjects: selectedSubjects,
        teaching_grades: teachingGrades,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      } : {
        user_type: 'student',
        grade: selectedGrade,
        grade_level: gradeInfo?.level,
        interests: selectedInterests,
        goals: selectedGoals,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      // Try update first
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Update error, trying insert:', updateError);
        // Try insert if update fails (profile might not exist yet)
        const { error: insertError } = await supabase.from('user_profiles').insert({
          user_id: user.id,
          ...updateData,
        });
        
        if (insertError) {
          console.error('Insert error:', insertError);
          // Even if DB fails, still redirect - onboarding is optional for UX
        }
      }

      // ALWAYS redirect, even if DB operations fail
      // This ensures users aren't stuck on onboarding
      if (userType === 'teacher') {
        router.push('/teacher');
      } else {
        router.push('/student');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      // Still redirect on error - don't trap users
      if (userType === 'teacher') {
        router.push('/teacher');
      } else {
        router.push('/student');
      }
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return userType !== null;
      case 2: 
        if (userType === 'teacher') return selectedSubjects.length > 0;
        return selectedGrade !== null;
      case 3:
        if (userType === 'teacher') return teachingGrades.length > 0;
        return selectedInterests.length > 0;
      case 4:
        if (userType === 'teacher') return true; // Final step for teachers
        return selectedGoals.length > 0;
      case 5: return true; // Final step for students
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-xl"
      >
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full transition-all ${
                i < step ? 'bg-purple-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: User Type */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <div className="text-6xl mb-4">🎓</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Καλώς ήρθες στο Noetium!
              </h2>
              <p className="text-gray-500 mb-6">Ποιος είσαι;</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setUserType('student')}
                  className={`p-6 rounded-xl transition-all ${
                    userType === 'student'
                      ? 'bg-purple-100 ring-2 ring-purple-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-4xl">👨‍🎓</span>
                  <p className="font-semibold mt-2">Μαθητής</p>
                  <p className="text-xs text-gray-500">Μάθηση & Εξάσκηση</p>
                </button>
                
                <button
                  onClick={() => setUserType('teacher')}
                  className={`p-6 rounded-xl transition-all ${
                    userType === 'teacher'
                      ? 'bg-purple-100 ring-2 ring-purple-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-4xl">👩‍🏫</span>
                  <p className="font-semibold mt-2">Εκπαιδευτικός</p>
                  <p className="text-xs text-gray-500">Εργαλεία & Μαθητές</p>
                </button>
              </div>
            </motion.div>
          )}

          {/* STUDENT FLOW */}
          {/* Step 2 (Student): Grade Selection */}
          {step === 2 && userType === 'student' && (
            <motion.div
              key="step2-student"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
                Σε ποια τάξη είσαι;
              </h2>
              <p className="text-gray-500 text-center mb-6">
                Αυτό μας βοηθάει να προσαρμόσουμε το περιεχόμενο
              </p>
              
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {['dimotiko', 'gymnasio', 'lykeio'].map(level => (
                  <div key={level} className="mb-4">
                    <p className="text-xs text-gray-400 uppercase mb-2">
                      {level === 'dimotiko' ? 'Δημοτικό' : level === 'gymnasio' ? 'Γυμνάσιο' : 'Λύκειο'}
                    </p>
                    <div className="space-y-2">
                      {grades.filter(g => g.level === level).map(grade => (
                        <button
                          key={grade.id}
                          onClick={() => setSelectedGrade(grade.id)}
                          className={`w-full p-3 rounded-xl text-left transition-all ${
                            selectedGrade === grade.id
                              ? 'bg-purple-100 ring-2 ring-purple-500'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <span className="font-medium">{grade.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3 (Student): Interests */}
          {step === 3 && userType === 'student' && (
            <motion.div
              key="step3-student"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
                Τι σε ενδιαφέρει;
              </h2>
              <p className="text-gray-500 text-center mb-6">Διάλεξε όσα θέλεις</p>
              
              <div className="grid grid-cols-2 gap-3">
                {interests.map(interest => (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={`p-4 rounded-xl text-center transition-all ${
                      selectedInterests.includes(interest.id)
                        ? 'bg-purple-100 ring-2 ring-purple-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-2xl">{interest.icon}</span>
                    <p className="text-sm mt-1">{interest.label}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 4 (Student): Goals */}
          {step === 4 && userType === 'student' && (
            <motion.div
              key="step4-student"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
                Ποιος είναι ο στόχος σου;
              </h2>
              <p className="text-gray-500 text-center mb-6">Διάλεξε τουλάχιστον έναν</p>
              
              <div className="space-y-3">
                {goals.map(goal => (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all ${
                      selectedGoals.includes(goal.id)
                        ? 'bg-purple-100 ring-2 ring-purple-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-2xl">{goal.icon}</span>
                    <span className="font-medium">{goal.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* TEACHER FLOW */}
          {/* Step 2 (Teacher): Subjects */}
          {step === 2 && userType === 'teacher' && (
            <motion.div
              key="step2-teacher"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
                Τι διδάσκετε;
              </h2>
              <p className="text-gray-500 text-center mb-6">Επιλέξτε τα μαθήματά σας</p>
              
              <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {teacherSubjects.map(subject => (
                  <button
                    key={subject.id}
                    onClick={() => toggleSubject(subject.id)}
                    className={`p-4 rounded-xl text-center transition-all ${
                      selectedSubjects.includes(subject.id)
                        ? 'bg-purple-100 ring-2 ring-purple-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-2xl">{subject.icon}</span>
                    <p className="text-sm mt-1">{subject.label}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3 (Teacher): Teaching Grades */}
          {step === 3 && userType === 'teacher' && (
            <motion.div
              key="step3-teacher"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
                Σε ποιες τάξεις διδάσκετε;
              </h2>
              <p className="text-gray-500 text-center mb-6">Επιλέξτε όλες τις σχετικές</p>
              
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {['dimotiko', 'gymnasio', 'lykeio'].map(level => (
                  <div key={level} className="mb-4">
                    <p className="text-xs text-gray-400 uppercase mb-2">
                      {level === 'dimotiko' ? 'Δημοτικό' : level === 'gymnasio' ? 'Γυμνάσιο' : 'Λύκειο'}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {grades.filter(g => g.level === level).map(grade => (
                        <button
                          key={grade.id}
                          onClick={() => toggleTeachingGrade(grade.id)}
                          className={`p-2 rounded-lg text-center text-sm transition-all ${
                            teachingGrades.includes(grade.id)
                              ? 'bg-purple-100 ring-2 ring-purple-500'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          {grade.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 4 (Teacher): Ready! */}
          {step === 4 && userType === 'teacher' && (
            <motion.div
              key="step4-teacher"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Είστε έτοιμοι!
              </h2>
              <p className="text-gray-500 mb-6">
                Αποκτήστε πρόσβαση σε AI εργαλεία για εκπαιδευτικούς
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-purple-50 rounded-xl p-4">
                  <span className="text-2xl">📝</span>
                  <p className="text-sm font-medium mt-2">Σχέδια Μαθήματος</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <span className="text-2xl">🔢</span>
                  <p className="text-sm font-medium mt-2">Γεννήτρια Ασκήσεων</p>
                </div>
                <div className="bg-pink-50 rounded-xl p-4">
                  <span className="text-2xl">📸</span>
                  <p className="text-sm font-medium mt-2">Βαθμολόγηση Φωτό</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <span className="text-2xl">📈</span>
                  <p className="text-sm font-medium mt-2">Πρόοδος Μαθητών</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5 (Student): Ready! */}
          {step === 5 && userType === 'student' && (
            <motion.div
              key="step5-student"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Είσαι έτοιμος!
              </h2>
              <p className="text-gray-500 mb-6">
                Ας ξεκινήσουμε την περιπέτεια της μάθησης
              </p>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-50 rounded-xl p-4">
                  <span className="text-2xl">🤖</span>
                  <p className="text-xs text-gray-600 mt-2">AI Δάσκαλος</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <span className="text-2xl">🎯</span>
                  <p className="text-xs text-gray-600 mt-2">Badges</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <span className="text-2xl">📚</span>
                  <p className="text-xs text-gray-600 mt-2">5 Ενότητες</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={prevStep}
              className="flex-1 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              ← Πίσω
            </button>
          )}
          
          {step < totalSteps ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className={`flex-1 py-3 rounded-xl font-medium text-white transition-all ${
                canProceed()
                  ? 'bg-purple-500 hover:bg-purple-600'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              Συνέχεια →
            </button>
          ) : (
            <button
              onClick={completeOnboarding}
              disabled={loading || !canProceed()}
              className={`flex-1 py-3 rounded-xl font-medium text-white transition-all ${
                loading || !canProceed()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {loading ? 'Αποθήκευση...' : '🎉 Ας ξεκινήσουμε!'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
