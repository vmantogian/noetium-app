import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/auth'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // API routes - let them handle their own auth
  if (pathname.startsWith('/api')) {
    return supabaseResponse;
  }

  // Helper function to redirect based on user type
  const redirectToDashboard = async (profile: any) => {
    if (profile?.user_type === 'teacher') {
      return NextResponse.redirect(new URL('/teacher', request.url));
    } else if (profile?.user_type === 'parent') {
      return NextResponse.redirect(new URL('/parent', request.url));
    } else {
      return NextResponse.redirect(new URL('/student', request.url));
    }
  };

  // Root redirect
  if (pathname === '/') {
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_type, onboarding_completed')
        .eq('user_id', user.id)
        .single();

      if (!profile?.onboarding_completed) {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }

      return redirectToDashboard(profile);
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If user is not logged in and trying to access protected route
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is logged in and trying to access login/signup
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single();

    return redirectToDashboard(profile);
  }

  // Check onboarding status for authenticated users
  if (user && !isPublicRoute && pathname !== '/onboarding') {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed, user_type, can_access_teacher')
      .eq('user_id', user.id)
      .single();

    // If profile doesn't exist or onboarding not completed, redirect to onboarding
    if (!profile || !profile.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // Check teacher access
    if (pathname.startsWith('/teacher')) {
      if (profile.user_type !== 'teacher' && !profile.can_access_teacher) {
        return redirectToDashboard(profile);
      }
    }

    // Check parent access
    if (pathname.startsWith('/parent')) {
      if (profile.user_type !== 'parent') {
        return redirectToDashboard(profile);
      }
    }

    // Check student access (optional - students shouldn't access teacher/parent areas)
    if (pathname.startsWith('/student')) {
      // Allow all user types to access student area for now
      // Or restrict: if (profile.user_type !== 'student') { return redirectToDashboard(profile); }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
