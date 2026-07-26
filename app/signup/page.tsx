'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

type UserRole = 'student' | 'teacher' | 'parent';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRole = searchParams.get('role') as UserRole | null;
  
  const [selectedRole, setSelectedRole] = useState<UserRole>(preselectedRole || 'student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const roles: { id: UserRole; label: string; icon: string }[] = [
    { id: 'student', label: 'Μαθητής', icon: '👨‍🎓' },
    { id: 'teacher', label: 'Εκπαιδευτικός', icon: '👩‍🏫' },
    { id: 'parent', label: 'Γονέας', icon: '👨‍👩‍👧' },
  ];

  // Clear any existing session when signup page loads
  useEffect(() => {
    const clearSession = async () => {
      try {
        const supabase = createClient();
        // Check if there's an existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Sign out to clear the session for fresh signup
          await supabase.auth.signOut();
        }
      } catch (err) {
        console.error('Error clearing session:', err);
      } finally {
        setInitialized(true);
      }
    };
    
    clearSession();
  }, []);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError('Οι κωδικοί δεν ταιριάζουν');
      return;
    }

    if (password.length < 6) {
      setError('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            role: selectedRole,
          },
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Κάτι πήγε στραβά. Δοκίμασε ξανά.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignup = async (provider: 'google' | 'azure' | 'apple') => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Make sure we're signed out before OAuth
      await supabase.auth.signOut();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=${selectedRole}`,
          queryParams: {
            prompt: 'select_account', // Force Google to show account picker
          },
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err) {
      setError('Κάτι πήγε στραβά. Δοκίμασε ξανά.');
      setLoading(false);
    }
  };

  // Show loading while clearing session
  if (!initialized) {
    return (
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl text-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#2A50DF] border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Φόρτωση...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl text-center">
        <div className="text-6xl mb-4">📧</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Έλεγξε το email σου!</h1>
        <p className="text-gray-600 mb-6">
          Σου στείλαμε ένα link επιβεβαίωσης στο <strong>{email}</strong>
        </p>
        <Link 
          href="/login"
          className="text-[#2A50DF] hover:text-[#1E3DB8] font-medium"
        >
          ← Πίσω στη σύνδεση
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
      {/* Logo - h-20 (80px) */}
      <div className="text-center mb-6">
        <Link href="/" className="inline-block">
          <Image src="/logo.svg" alt="noetium AI" width={300} height={80} className="h-[80px] w-auto mx-auto" />
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Δημιουργία Λογαριασμού</h1>
        <p className="text-gray-600 mt-1">Επίλεξε τον ρόλο σου</p>
      </div>

      {/* Role Toggle Buttons */}
      <div className="flex gap-2 mb-6">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => setSelectedRole(role.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl font-medium transition-all ${
              selectedRole === role.id
                ? 'bg-[#2A50DF] text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="text-lg">{role.icon}</span>
            <span className="text-sm sm:text-base">{role.label}</span>
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {/* OAuth Buttons */}
      <div className="space-y-3 mb-6">
        <button
          onClick={() => handleOAuthSignup('google')}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-gray-700 font-medium">Συνέχεια με Google</span>
        </button>

        <button
          onClick={() => handleOAuthSignup('azure')}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#F25022" d="M1 1h10v10H1z"/>
            <path fill="#00A4EF" d="M1 13h10v10H1z"/>
            <path fill="#7FBA00" d="M13 1h10v10H13z"/>
            <path fill="#FFB900" d="M13 13h10v10H13z"/>
          </svg>
          <span className="text-gray-700 font-medium">Συνέχεια με Microsoft</span>
        </button>

        {process.env.NEXT_PUBLIC_ENABLE_APPLE_AUTH === 'true' && (
          <button
            onClick={() => handleOAuthSignup('apple')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#000000" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span className="text-gray-700 font-medium">{'\u03A3\u03C5\u03BD\u03AD\u03C7\u03B5\u03B9\u03B1 \u03BC\u03B5 Apple'}</span>
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">ή με email</span>
        </div>
      </div>

      {/* Email Form */}
      <form onSubmit={handleEmailSignup} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A50DF] focus:border-[#2A50DF] text-gray-900 placeholder-gray-400 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Κωδικός
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A50DF] focus:border-[#2A50DF] text-gray-900 placeholder-gray-400 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Επιβεβαίωση Κωδικού
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A50DF] focus:border-[#2A50DF] text-gray-900 placeholder-gray-400 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#2A50DF] text-white rounded-xl font-medium hover:bg-[#1E3DB8] transition-colors disabled:opacity-50"
        >
          {loading ? 'Περίμενε...' : 'Δημιουργία Λογαριασμού'}
        </button>
      </form>

      {/* Login Link */}
      <p className="mt-6 text-center text-gray-600">
        Έχεις ήδη λογαριασμό;{' '}
        <Link href="/login" className="text-[#2A50DF] hover:text-[#1E3DB8] font-medium">
          Σύνδεση
        </Link>
      </p>

      {/* Terms */}
      <p className="mt-4 text-center text-xs text-gray-500">
        Με την εγγραφή αποδέχεσαι τους{' '}
        <Link href="/terms" className="underline">Όρους Χρήσης</Link>
        {' '}και την{' '}
        <Link href="/privacy" className="underline">Πολιτική Απορρήτου</Link>
      </p>
    </div>
  );
}

function SignupFormSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-pulse">
      <div className="h-20 bg-gray-200 rounded-xl mx-auto w-48 mb-6"></div>
      <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
      <div className="flex gap-2 mb-6">
        <div className="flex-1 h-12 bg-gray-200 rounded-xl"></div>
        <div className="flex-1 h-12 bg-gray-200 rounded-xl"></div>
        <div className="flex-1 h-12 bg-gray-200 rounded-xl"></div>
      </div>
      <div className="space-y-3">
        <div className="h-12 bg-gray-200 rounded-xl"></div>
        <div className="h-12 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2A50DF] via-[#25A1B0] to-[#D9325C] flex items-center justify-center p-4">
      <Suspense fallback={<SignupFormSkeleton />}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
