'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Age-Appropriate Student Dashboard
 * 
 * - Γ'-Δ' Δημοτικού (8-9): SUPER SIMPLE - huge buttons, minimal text, bright colors
 * - Ε'-ΣΤ' Δημοτικού (10-11): Simple, playful, more features
 * - Γυμνάσιο (12-14): Standard UI
 * - Λύκειο (15-17): Professional, exam-focused
 */

type GradeLevel = 'primary_middle' | 'primary_upper' | 'gymnasium' | 'lyceum';

interface StudentProfile {
  name: string;
  firstName: string;
  grade: string;
  gradeLevel: GradeLevel;
  tutorName: string;
  tutorAvatar: string;
}

interface Stats {
  streak: number;
  badges: number;
  todayActivities: number;
  totalActivities: number;
}

const getGradeLevel = (grade: string): GradeLevel => {
  if (['primary_3', 'primary_4'].includes(grade)) return 'primary_middle';
  if (['primary_5', 'primary_6'].includes(grade)) return 'primary_upper';
  if (grade?.startsWith('gymnasium')) return 'gymnasium';
  return 'lyceum';
};

const getGradeName = (grade: string): string => {
  const names: Record<string, string> = {
    'primary_3': 'Γ\' Δημοτικού',
    'primary_4': 'Δ\' Δημοτικού',
    'primary_5': 'Ε\' Δημοτικού',
    'primary_6': 'ΣΤ\' Δημοτικού',
    'gymnasium_1': 'Α\' Γυμνασίου',
    'gymnasium_2': 'Β\' Γυμνασίου',
    'gymnasium_3': 'Γ\' Γυμνασίου',
    'lyceum_1': 'Α\' Λυκείου',
    'lyceum_2': 'Β\' Λυκείου',
    'lyceum_3': 'Γ\' Λυκείου',
  };
  return names[grade] || grade;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Καλημέρα';
  if (hour < 18) return 'Καλησπέρα';
  return 'Καληνύχτα';
};

export default function StudentDashboard() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState<Stats>({ streak: 0, badges: 0, todayActivities: 0, totalActivities: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get user profile
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('name, grade_level')
        .eq('user_id', user.id)
        .single();

      // Get student profile
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('grade, tutor_name, tutor_avatar')
        .eq('user_id', user.id)
        .single();

      if (userProfile || studentProfile) {
        const grade = studentProfile?.grade || userProfile?.grade_level || 'gymnasium_1';
        const fullName = userProfile?.name || 'Μαθητή';
        setProfile({
          name: fullName,
          firstName: fullName.split(' ')[0],
          grade: grade,
          gradeLevel: getGradeLevel(grade),
          tutorName: studentProfile?.tutor_name || 'Αθηνά',
          tutorAvatar: studentProfile?.tutor_avatar || '🦉',
        });
      }

      // Fetch stats from API
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          if (data?.stats) {
            setStats({
              streak: data.stats.currentStreak ?? data.stats.streak ?? 0,
              badges: data.stats.badgesCount ?? data.stats.badgesEarned ?? 0,
              todayActivities: data.stats.todayActivities ?? 0,
              totalActivities: data.stats.totalActivities ?? 0,
            });
          }
        }
      } catch (e) {
        console.error('Stats fetch error:', e);
      }

    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Loading state with grade-appropriate animation
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-4 animate-bounce">📚</div>
          <p className="text-gray-600 font-medium text-lg">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  const gradeLevel = profile?.gradeLevel || 'gymnasium';

  // ============================================================
  // PRIMARY MIDDLE (Γ'-Δ' Δημοτικού) - SUPER SIMPLE UI
  // Large buttons, minimal text, bright playful colors
  // ============================================================
  if (gradeLevel === 'primary_middle') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-100 via-orange-50 to-pink-50 pb-28">
        <div className="container mx-auto px-4 py-6 max-w-lg">
          {/* Big Greeting with Tutor Avatar */}
          <div className="text-center mb-8">
            <div className="text-8xl mb-4 animate-bounce">{profile?.tutorAvatar || '🦉'}</div>
            <h1 className="text-3xl font-bold text-gray-800">
              {getGreeting()}, {profile?.firstName}! 👋
            </h1>
            <p className="text-xl text-gray-600 mt-2">
              Τι θέλεις να κάνεις;
            </p>
          </div>

          {/* Streak - Big and Fun */}
          {stats.streak > 0 && (
            <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-3xl p-6 mb-8 text-white text-center shadow-lg transform hover:scale-105 transition-transform">
              <div className="text-6xl mb-2">🔥 {stats.streak}</div>
              <p className="text-2xl font-bold">Μέρες σερί!</p>
            </div>
          )}

          {/* Main Actions - HUGE BUTTONS */}
          <div className="space-y-5 mb-8">
            <Link
              href="/chat"
              className="block bg-gradient-to-r from-purple-500 to-indigo-500 rounded-3xl p-8 text-center shadow-xl transform hover:scale-105 transition-all active:scale-95"
            >
              <div className="text-7xl mb-3">💬</div>
              <p className="text-2xl font-bold text-white">Μίλα με τον {profile?.tutorName}</p>
            </Link>

            <Link
              href="/tools"
              className="block bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl p-8 text-center shadow-xl transform hover:scale-105 transition-all active:scale-95"
            >
              <div className="text-7xl mb-3">📸</div>
              <p className="text-2xl font-bold text-white">Βοήθεια με Άσκηση</p>
            </Link>

            <Link
              href="/mindfulness"
              className="block bg-gradient-to-r from-green-500 to-teal-500 rounded-3xl p-8 text-center shadow-xl transform hover:scale-105 transition-all active:scale-95"
            >
              <div className="text-7xl mb-3">🧘</div>
              <p className="text-2xl font-bold text-white">Χαλάρωση</p>
            </Link>
          </div>

          {/* Fun Games Section */}
          <div className="bg-white rounded-3xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">🎮 Παιχνίδια</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/quiz" className="bg-yellow-100 rounded-2xl p-5 text-center hover:bg-yellow-200 transition-colors active:scale-95 transform">
                <div className="text-5xl mb-2">❓</div>
                <p className="text-lg font-bold text-gray-800">Κουίζ</p>
              </Link>
              <Link href="/art" className="bg-pink-100 rounded-2xl p-5 text-center hover:bg-pink-200 transition-colors active:scale-95 transform">
                <div className="text-5xl mb-2">🎨</div>
                <p className="text-lg font-bold text-gray-800">Ζωγραφική</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Simple Bottom Nav - Large Icons */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-orange-300 z-50 safe-area-pb">
          <div className="flex justify-around py-4">
            <Link href="/student" className="flex flex-col items-center text-orange-500">
              <span className="text-4xl">🏠</span>
              <span className="text-sm font-bold mt-1">Αρχική</span>
            </Link>
            <Link href="/chat" className="flex flex-col items-center text-gray-400 hover:text-purple-500">
              <span className="text-4xl">💬</span>
              <span className="text-sm font-bold mt-1">Βοηθός</span>
            </Link>
            <Link href="/profile" className="flex flex-col items-center text-gray-400 hover:text-blue-500">
              <span className="text-4xl">👤</span>
              <span className="text-sm font-bold mt-1">Εγώ</span>
            </Link>
          </div>
        </nav>
      </div>
    );
  }

  // ============================================================
  // PRIMARY UPPER (Ε'-ΣΤ' Δημοτικού) - SIMPLE BUT MORE FEATURES
  // ============================================================
  if (gradeLevel === 'primary_upper') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 via-blue-50 to-white pb-24">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          {/* Header with Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="text-5xl animate-bounce">{profile?.tutorAvatar || '🦉'}</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {getGreeting()}, {profile?.firstName}! 👋
              </h1>
              <p className="text-gray-500">{getGradeName(profile?.grade || '')}</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-2xl p-4 text-center shadow-md">
              <div className="text-3xl font-bold text-orange-500">🔥 {stats.streak}</div>
              <p className="text-sm text-gray-500">Streak</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center shadow-md">
              <div className="text-3xl font-bold text-purple-500">🏆 {stats.badges}</div>
              <p className="text-sm text-gray-500">Badges</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center shadow-md">
              <div className="text-3xl font-bold text-green-500">✓ {stats.todayActivities}</div>
              <p className="text-sm text-gray-500">Σήμερα</p>
            </div>
          </div>

          {/* Main Actions - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Link
              href="/chat"
              className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-center shadow-lg transform hover:scale-105 transition-transform"
            >
              <div className="text-5xl mb-2">💬</div>
              <p className="text-lg font-bold text-white">AI Δάσκαλος</p>
            </Link>
            <Link
              href="/tools"
              className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-center shadow-lg transform hover:scale-105 transition-transform"
            >
              <div className="text-5xl mb-2">📸</div>
              <p className="text-lg font-bold text-white">Photo Helper</p>
            </Link>
            <Link
              href="/mindfulness"
              className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-6 text-center shadow-lg transform hover:scale-105 transition-transform"
            >
              <div className="text-5xl mb-2">🧘</div>
              <p className="text-lg font-bold text-white">Χαλάρωση</p>
            </Link>
            <Link
              href="/quiz"
              className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl p-6 text-center shadow-lg transform hover:scale-105 transition-transform"
            >
              <div className="text-5xl mb-2">❓</div>
              <p className="text-lg font-bold text-white">Κουίζ</p>
            </Link>
          </div>

          {/* Enrichment Section */}
          <div className="bg-white rounded-2xl p-5 shadow-md mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">🌟 Μάθε κάτι νέο!</h2>
            <div className="grid grid-cols-3 gap-3">
              <Link href="/cs-ai" className="bg-blue-50 rounded-xl p-4 text-center hover:bg-blue-100 transition-colors">
                <div className="text-4xl mb-2">💻</div>
                <p className="text-sm font-medium text-gray-700">Coding</p>
              </Link>
              <Link href="/financial" className="bg-green-50 rounded-xl p-4 text-center hover:bg-green-100 transition-colors">
                <div className="text-4xl mb-2">💰</div>
                <p className="text-sm font-medium text-gray-700">Χρήματα</p>
              </Link>
              <Link href="/art" className="bg-pink-50 rounded-xl p-4 text-center hover:bg-pink-100 transition-colors">
                <div className="text-4xl mb-2">🎨</div>
                <p className="text-sm font-medium text-gray-700">Τέχνη</p>
              </Link>
            </div>
          </div>

          {/* Tip of the Day */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-5 text-white">
            <div className="flex items-start gap-3">
              <span className="text-3xl">💡</span>
              <div>
                <h3 className="font-bold text-lg">Tip της Ημέρας</h3>
                <p className="text-white/90 mt-1">
                  Ρώτα "γιατί;" για να καταλάβεις καλύτερα!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
          <div className="flex justify-around py-3">
            <Link href="/student" className="flex flex-col items-center text-teal-600">
              <span className="text-2xl">🏠</span>
              <span className="text-xs font-medium mt-1">Αρχική</span>
            </Link>
            <Link href="/enrichment" className="flex flex-col items-center text-gray-400 hover:text-teal-500">
              <span className="text-2xl">🌟</span>
              <span className="text-xs font-medium mt-1">Μάθηση</span>
            </Link>
            <Link href="/chat" className="flex flex-col items-center text-gray-400 hover:text-purple-500">
              <span className="text-2xl">💬</span>
              <span className="text-xs font-medium mt-1">AI</span>
            </Link>
            <Link href="/profile" className="flex flex-col items-center text-gray-400 hover:text-blue-500">
              <span className="text-2xl">👤</span>
              <span className="text-xs font-medium mt-1">Προφίλ</span>
            </Link>
          </div>
        </nav>
      </div>
    );
  }

  // ============================================================
  // GYMNASIUM (Α'-Γ' Γυμνασίου) - STANDARD UI
  // ============================================================
  if (gradeLevel === 'gymnasium') {
    const progressPercent = Math.min(Math.round((stats.totalActivities / 50) * 100), 100);
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-20 md:pb-8">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{profile?.tutorAvatar || '🦉'}</div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {getGreeting()}, {profile?.firstName}!
                </h1>
                <p className="text-sm text-gray-500">{getGradeName(profile?.grade || '')}</p>
              </div>
            </div>
            <Link href="/profile" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
              👤
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-orange-500">🔥 {stats.streak}</p>
              <p className="text-xs text-gray-500">Streak</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-purple-500">🏆 {stats.badges}</p>
              <p className="text-xs text-gray-500">Badges</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-green-500">✓ {stats.todayActivities}</p>
              <p className="text-xs text-gray-500">Σήμερα</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-blue-500">📈 {progressPercent}%</p>
              <p className="text-xs text-gray-500">Πρόοδος</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">⚡ Γρήγορες Ενέργειες</h2>
            <div className="grid grid-cols-4 gap-3">
              {[
                { href: '/chat', icon: '💬', label: 'AI Βοηθός', color: 'bg-purple-500' },
                { href: '/tools', icon: '📸', label: 'Photo Help', color: 'bg-blue-500' },
                { href: '/mindfulness', icon: '🧘', label: 'Χαλάρωση', color: 'bg-green-500' },
                { href: '/debate', icon: '🎭', label: 'Debate', color: 'bg-orange-500' },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="bg-white rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-all"
                >
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-xl mx-auto mb-2`}>
                    {action.icon}
                  </div>
                  <p className="text-xs text-gray-700 font-medium">{action.label}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Continue Learning */}
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">📚 Συνέχισε να Μαθαίνεις</h2>
            {stats.todayActivities === 0 ? (
              <div className="flex items-center gap-4 p-3 bg-indigo-50 rounded-xl">
                <span className="text-3xl">🎯</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Ξεκίνα τη μέρα σου!</p>
                  <p className="text-sm text-gray-500">Δεν έχεις κάνει ακόμα κάτι σήμερα</p>
                </div>
                <Link href="/chat" className="bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600">
                  Ξεκίνα
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-3 bg-green-50 rounded-xl">
                <span className="text-3xl">🎉</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Συγχαρητήρια!</p>
                  <p className="text-sm text-gray-500">Έχεις ολοκληρώσει {stats.todayActivities} δραστηριότητ{stats.todayActivities === 1 ? 'α' : 'ες'}</p>
                </div>
                <Link href="/enrichment" className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600">
                  Συνέχισε
                </Link>
              </div>
            )}
          </div>

          {/* Enrichment */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-gray-700">🌟 Εμπλουτισμός</h2>
              <Link href="/enrichment" className="text-indigo-600 text-sm font-medium hover:underline">Δες όλα →</Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { href: '/cs-ai', icon: '💻', title: 'Coding', subtitle: 'Block puzzles' },
                { href: '/financial', icon: '💰', title: 'Οικονομικά', subtitle: 'Προϋπολογισμός' },
                { href: '/philosophy', icon: '🤔', title: 'Φιλοσοφία', subtitle: 'Κριτική σκέψη' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <p className="font-medium text-gray-800 mt-2 text-sm">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.subtitle}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Daily Tip */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-5 text-white">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="font-semibold">Tip της Ημέρας</h3>
                <p className="text-white/90 text-sm mt-1">
                  Η Σωκρατική μέθοδος βασίζεται στο να κάνεις ερωτήσεις. Μην φοβάσαι να ρωτήσεις "γιατί"!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="flex justify-around py-2">
            <Link href="/student" className="flex flex-col items-center px-3 py-1 text-indigo-600">
              <span className="text-xl">🏠</span>
              <span className="text-xs mt-1 font-medium">Αρχική</span>
            </Link>
            <Link href="/enrichment" className="flex flex-col items-center px-3 py-1 text-gray-500 hover:text-indigo-500">
              <span className="text-xl">🌟</span>
              <span className="text-xs mt-1 font-medium">Μάθηση</span>
            </Link>
            <Link href="/chat" className="flex flex-col items-center px-3 py-1 text-gray-500 hover:text-purple-500">
              <span className="text-xl">💬</span>
              <span className="text-xs mt-1 font-medium">AI</span>
            </Link>
            <Link href="/profile" className="flex flex-col items-center px-3 py-1 text-gray-500 hover:text-blue-500">
              <span className="text-xl">👤</span>
              <span className="text-xs mt-1 font-medium">Προφίλ</span>
            </Link>
          </div>
        </nav>
      </div>
    );
  }

  // ============================================================
  // LYCEUM (Α'-Γ' Λυκείου) - PROFESSIONAL, EXAM-FOCUSED
  // ============================================================
  const progressPercent = Math.min(Math.round((stats.totalActivities / 50) * 100), 100);
  const isLyceum3 = profile?.grade === 'lyceum_3';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header - Professional */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {getGreeting()}, {profile?.firstName}
            </h1>
            <p className="text-sm text-gray-500">{getGradeName(profile?.grade || '')} {isLyceum3 && '• Πανελλήνιες 2025'}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-3xl">{profile?.tutorAvatar || '🦉'}</div>
            <Link href="/profile" className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300">
              👤
            </Link>
          </div>
        </div>

        {/* Exam Countdown (for Γ' Λυκείου) */}
        {isLyceum3 && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-4 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Πανελλήνιες 2025</p>
                <p className="text-2xl font-bold">~150 μέρες</p>
              </div>
              <Link href="/study-plan" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Πρόγραμμα →
              </Link>
            </div>
          </div>
        )}

        {/* Stats - Compact Professional */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-100">
            <p className="text-lg font-bold text-orange-600">{stats.streak}</p>
            <p className="text-xs text-gray-500">🔥 Streak</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-100">
            <p className="text-lg font-bold text-purple-600">{stats.badges}</p>
            <p className="text-xs text-gray-500">🏆 Badges</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-100">
            <p className="text-lg font-bold text-green-600">{stats.todayActivities}</p>
            <p className="text-xs text-gray-500">✓ Σήμερα</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-100">
            <p className="text-lg font-bold text-blue-600">{progressPercent}%</p>
            <p className="text-xs text-gray-500">📊 Πρόοδος</p>
          </div>
        </div>

        {/* Study Tools - Priority Order */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">📚 Εργαλεία Μελέτης</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: '/chat', icon: '💬', label: 'AI Καθηγητής', desc: 'Εξήγηση θεωρίας' },
              { href: '/tools', icon: '📸', label: 'Scan Άσκηση', desc: 'Λύση βήμα-βήμα' },
              { href: '/notes', icon: '📝', label: 'Σημειώσεις', desc: 'Οργάνωση ύλης' },
              { href: '/quiz', icon: '✍️', label: 'Τεστ', desc: 'Αυτοαξιολόγηση' },
            ].map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="text-2xl mb-2">{tool.icon}</div>
                <p className="font-medium text-gray-900 text-sm">{tool.label}</p>
                <p className="text-xs text-gray-500">{tool.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Subject Focus (for exam students) */}
        {isLyceum3 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">🎯 Μαθήματα Κατεύθυνσης</h2>
            <div className="flex flex-wrap gap-2">
              {['Μαθηματικά', 'Φυσική', 'Χημεία', 'Έκθεση'].map((subject) => (
                <Link
                  key={subject}
                  href={`/subjects/${subject.toLowerCase()}`}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  {subject}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Link href="/mindfulness" className="bg-green-50 rounded-xl p-4 text-center hover:bg-green-100 transition-colors">
            <div className="text-2xl mb-1">🧘</div>
            <p className="text-sm font-medium text-green-700">Διάλειμμα</p>
          </Link>
          <Link href="/debate" className="bg-orange-50 rounded-xl p-4 text-center hover:bg-orange-100 transition-colors">
            <div className="text-2xl mb-1">🎭</div>
            <p className="text-sm font-medium text-orange-700">Debate</p>
          </Link>
          <Link href="/philosophy" className="bg-purple-50 rounded-xl p-4 text-center hover:bg-purple-100 transition-colors">
            <div className="text-2xl mb-1">🤔</div>
            <p className="text-sm font-medium text-purple-700">Φιλοσοφία</p>
          </Link>
        </div>

        {/* Tip - More Academic */}
        <div className="bg-slate-800 rounded-xl p-4 text-white">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <h3 className="font-medium">Τεχνική Pomodoro</h3>
              <p className="text-slate-300 text-sm mt-1">
                25 λεπτά μελέτη, 5 λεπτά διάλειμμα. Μετά από 4 κύκλους, 15-30 λεπτά διάλειμμα.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Nav - Minimal */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around py-2">
          <Link href="/student" className="flex flex-col items-center px-3 py-1 text-blue-600">
            <span className="text-xl">🏠</span>
            <span className="text-xs mt-1 font-medium">Αρχική</span>
          </Link>
          <Link href="/subjects" className="flex flex-col items-center px-3 py-1 text-gray-500 hover:text-blue-500">
            <span className="text-xl">📚</span>
            <span className="text-xs mt-1 font-medium">Μαθήματα</span>
          </Link>
          <Link href="/chat" className="flex flex-col items-center px-3 py-1 text-gray-500 hover:text-purple-500">
            <span className="text-xl">💬</span>
            <span className="text-xs mt-1 font-medium">AI</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center px-3 py-1 text-gray-500 hover:text-gray-700">
            <span className="text-xl">👤</span>
            <span className="text-xs mt-1 font-medium">Προφίλ</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
