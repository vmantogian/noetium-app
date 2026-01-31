'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Main Onboarding Router
 * 
 * Detects user role from profile/metadata and redirects to appropriate onboarding:
 * - student → Default to "quick" flow (it collects birth year and can determine grade)
 * - teacher → Professional teacher onboarding
 * - parent → Family-focused parent onboarding
 * 
 * Note: For students, all three onboarding options collect birth year, so they
 * can all auto-determine the grade. We default to "quick" for simplicity.
 * 
 * If you want age-based routing, you can change this after collecting birth year
 * in a future version.
 */

type UserRole = 'student' | 'teacher' | 'parent';

export default function OnboardingRouter() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detectRoleAndRedirect();
  }, []);

  const detectRoleAndRedirect = async () => {
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('No user found:', userError);
        router.push('/login');
        return;
      }

      // Check if profile exists and get user info
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('onboarding_completed, user_type, grade')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError);
      }

      // If onboarding already completed, redirect to appropriate dashboard
      if (profile?.onboarding_completed) {
        const dashboard = getDashboardRoute(profile.user_type);
        router.push(dashboard);
        return;
      }

      // Get role from: profile > user metadata > default to student
      const role = (profile?.user_type || user.user_metadata?.role || 'student') as UserRole;

      // Route to appropriate onboarding
      switch (role) {
        case 'student':
          // For new students, use "quick" as the default
          // All student onboardings collect birth year and can determine grade
          // You can change this to 'magical' or 'socratic' if you prefer
          router.push('/onboarding/student/quick');
          break;
          
        case 'teacher':
          router.push('/onboarding/teacher');
          break;
          
        case 'parent':
          router.push('/onboarding/parent');
          break;
          
        default:
          router.push('/onboarding/student/quick');
      }
    } catch (err) {
      console.error('Onboarding routing error:', err);
      setError('Κάτι πήγε στραβά. Δοκίμασε να ανανεώσεις τη σελίδα.');
    } finally {
      setLoading(false);
    }
  };

  const getDashboardRoute = (userType: string | null): string => {
    switch (userType) {
      case 'student':
        return '/student';
      case 'teacher':
        return '/teacher';
      case 'parent':
        return '/parent';
      default:
        return '/student';
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
            className="px-6 py-3 bg-[#2A50DF] text-white rounded-xl hover:bg-[#1E3DB8] transition-colors"
          >
            Ανανέωση Σελίδας
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2A50DF] via-[#25A1B0] to-[#D9325C] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-12 max-w-md shadow-2xl text-center">
        <div className="text-7xl mb-6 animate-bounce">🎓</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Καλώς ήρθες στο Noetium!
        </h2>
        <p className="text-gray-600 mb-8">
          Ετοιμάζουμε την εμπειρία σου...
        </p>
        <div className="w-16 h-16 border-4 border-[#2A50DF] border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}
