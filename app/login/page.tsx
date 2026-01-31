'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

// Separate component that uses useSearchParams
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message === 'Invalid login credentials' 
          ? 'Λάθος email ή κωδικός' 
          : error.message);
        setLoading(false);
      } else if (data.user) {
        // Check if onboarding is completed
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('onboarding_completed, user_type')
          .eq('user_id', data.user.id)
          .single();

        if (profile?.onboarding_completed) {
          // Go to appropriate dashboard
          const dashboard = profile.user_type === 'teacher' ? '/teacher' 
                          : profile.user_type === 'parent' ? '/parent' 
                          : '/student';
          router.push(dashboard);
        } else {
          // Go to onboarding
          router.push('/onboarding');
        }
        router.refresh();
      }
    } catch (err) {
      setError('Κάτι πήγε στραβά. Δοκίμασε ξανά.');
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'azure') => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
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

  return (
    <div className="bg-white rounded-3xl p-8 md:p-10 w-full max-w-md shadow-2xl">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <Image 
          src="/logo.svg" 
          alt="Noetium" 
          width={180} 
          height={48} 
          className="h-12 w-auto"
          priority
        />
      </div>

      {/* Header with animated logo2 */}
      <div className="text-center mb-8">
        <div className="inline-block mb-4">
          <Image 
            src="/logo2.svg" 
            alt="" 
            width={72} 
            height={72} 
            className="w-18 h-18 animate-heartbeat"
            style={{ width: '72px', height: '72px' }}
            priority
          />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Καλώς ήρθες!</h1>
        <p className="text-gray-600 mt-2">Συνδέσου στο Noetium</p>
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
          onClick={() => handleOAuthLogin('google')}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
          onClick={() => handleOAuthLogin('azure')}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#F25022" d="M1 1h10v10H1z"/>
            <path fill="#00A4EF" d="M1 13h10v10H1z"/>
            <path fill="#7FBA00" d="M13 1h10v10H13z"/>
            <path fill="#FFB900" d="M13 13h10v10H13z"/>
          </svg>
          <span className="text-gray-700 font-medium">Συνέχεια με Microsoft</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">ή με email</span>
        </div>
      </div>

      {/* Email Form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4EA6DC] focus:border-[#4EA6DC] text-gray-900 transition-all disabled:opacity-50 disabled:bg-gray-50"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            Κωδικός
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4EA6DC] focus:border-[#4EA6DC] text-gray-900 transition-all disabled:opacity-50 disabled:bg-gray-50"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-gray-300 text-[#4EA6DC] focus:ring-[#4EA6DC]" 
            />
            <span className="ml-2 text-sm text-gray-600">Να με θυμάσαι</span>
          </label>
          <Link 
            href="/forgot-password" 
            className="text-sm text-[#4EA6DC] hover:text-[#113285] font-medium transition-colors"
          >
            Ξέχασες τον κωδικό;
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-[#4EA6DC] to-[#113285] text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Περίμενε...
            </span>
          ) : (
            'Σύνδεση'
          )}
        </button>
      </form>

      {/* Signup Link */}
      <p className="mt-8 text-center text-gray-600">
        Δεν έχεις λογαριασμό;{' '}
        <Link 
          href="/signup" 
          className="text-[#E32D91] hover:text-[#C830CC] font-semibold transition-colors"
        >
          Εγγραφή
        </Link>
      </p>
    </div>
  );
}

// Loading fallback with animated logo
function LoginFormSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-8 md:p-10 w-full max-w-md shadow-2xl">
      <div className="flex justify-center mb-6">
        <div className="h-12 w-44 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
      <div className="text-center mb-8">
        <div className="inline-block mb-4">
          <div className="w-18 h-18 bg-gray-200 rounded-full animate-pulse" style={{ width: '72px', height: '72px' }}></div>
        </div>
        <div className="h-8 bg-gray-200 rounded-lg w-48 mx-auto mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-36 mx-auto animate-pulse"></div>
      </div>
      <div className="space-y-3 mb-6">
        <div className="h-14 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="h-14 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
      <div className="space-y-4">
        <div className="h-14 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="h-14 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="h-14 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#87F1FF] via-[#4EA6DC] to-[#113285] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#E32D91]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#C830CC]/20 rounded-full blur-3xl"></div>
      </div>
      
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
