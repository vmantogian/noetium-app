'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Onboarding Router - Simplified
 * 
 * Routes users to their appropriate onboarding:
 * - student → /onboarding/student (single improved flow)
 * - teacher → /onboarding/teacher
 * - parent → /onboarding/parent
 */

export default function OnboardingRouter() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detectRoleAndRedirect();
  }, []);

  const detectRoleAndRedirect = async () => {
    try {
      const supabase = createClient();
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        router.push('/login');
        return;
      }

      // Check profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed, user_type')
        .eq('user_id', user.id)
        .single();

      // If already onboarded, go to dashboard
      if (profile?.onboarding_completed) {
        const dashboard = profile.user_type === 'teacher' ? '/teacher' 
                        : profile.user_type === 'parent' ? '/parent' 
                        : '/student';
        router.push(dashboard);
        return;
      }

      // Route based on role
      const role = profile?.user_type || user.user_metadata?.role || 'student';

      switch (role) {
        case 'student':
          router.push('/onboarding/student');
          break;
        case 'teacher':
          router.push('/onboarding/teacher');
          break;
        case 'parent':
          router.push('/onboarding/parent');
          break;
        default:
          router.push('/onboarding/student');
      }
    } catch (err) {
      console.error('Routing error:', err);
      setError('Κάτι πήγε στραβά. Ανανέωσε τη σελίδα.');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md shadow-2xl text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Σφάλμα</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            Ανανέωση
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-12 max-w-md shadow-2xl text-center">
        <div className="text-7xl mb-6 animate-bounce">🎓</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Καλώς ήρθες στο Noetium!
        </h2>
        <p className="text-gray-600 mb-8">
          Ετοιμάζουμε την εμπειρία σου...
        </p>
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}
