import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

interface CookieToSet {
  name: string;
  value: string;
  options?: {
    path?: string;
    maxAge?: number;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  };
}

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
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
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

  // PUBLIC ROUTES - No authentication required
  const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/auth', '/terms', '/privacy', '/contact'];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth');

  // API routes - let them handle their own auth
  if (pathname.startsWith('/api')) {
    return supabaseResponse;
  }

  // Landing page: if user is logged in, redirect to dashboard
  if (pathname === '/' && user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type, onboarding_completed')
      .eq('user_id', user.id)
      .single();

    if (!profile?.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // Redirect to appropriate dashboard
    if (profile?.user_type === 'teacher') {
      return NextResponse.redirect(new URL('/teacher', request.url));
    } else if (profile?.user_type === 'parent') {
      return NextResponse.redirect(new URL('/parent', request.url));
    } else {
      return NextResponse.redirect(new URL('/student', request.url));
    }
  }

  // If public route, allow access
  if (isPublicRoute) {
    return supabaseResponse;
  }

  // If user is not logged in and trying to access protected route
  if (!user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is logged in and trying to access login/signup, redirect to dashboard
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single();

    if (profile?.user_type === 'teacher') {
      return NextResponse.redirect(new URL('/teacher', request.url));
    } else if (profile?.user_type === 'parent') {
      return NextResponse.redirect(new URL('/parent', request.url));
    } else {
      return NextResponse.redirect(new URL('/student', request.url));
    }
  }

  // Check onboarding status for authenticated users
  if (user && pathname !== '/onboarding') {
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
        if (profile.user_type === 'parent') {
          return NextResponse.redirect(new URL('/parent', request.url));
        }
        return NextResponse.redirect(new URL('/student', request.url));
      }
    }

    // Check parent access
    if (pathname.startsWith('/parent')) {
      if (profile.user_type !== 'parent') {
        if (profile.user_type === 'teacher') {
          return NextResponse.redirect(new URL('/teacher', request.url));
        }
        return NextResponse.redirect(new URL('/student', request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
