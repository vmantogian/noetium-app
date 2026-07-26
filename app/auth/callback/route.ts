import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Auth Callback Handler - Integrates with your signup page
 * 
 * This handler:
 * 1. Exchanges the OAuth code for a session
 * 2. Creates/updates user profile with the role from signup
 * 3. Redirects to onboarding if not completed, or dashboard if done
 */

/**
 * Behind Vercel's proxy, request.url can carry the internal deployment host
 * and/or an http:// protocol (TLS is terminated at the edge). Redirecting to
 * an http:// origin breaks Secure session cookies, which surfaces as the
 * classic "login succeeds, then bounces back to /login" loop.
 * Always derive the public origin from the forwarded headers.
 */
/**
 * Apple's "Hide My Email" returns an opaque relay address such as
 * x7h3k9m2p1@privaterelay.appleid.com, and Apple only sends the real name on
 * the FIRST authorisation - never again. Using the email local part as a
 * display name would permanently label those users with a random string.
 */
function deriveDisplayName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): string {
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const fromMeta =
    meta.full_name ||
    meta.name ||
    [meta.given_name, meta.family_name].filter(Boolean).join(' ').trim();
  if (fromMeta) return fromMeta;

  const email = user.email ?? '';
  if (email && !email.endsWith('@privaterelay.appleid.com')) {
    return email.split('@')[0];
  }
  return 'User';
}

function getOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  return new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = getOrigin(request);
  const code = searchParams.get('code');
  const role = searchParams.get('role');

  // The login page sends ?redirect=... but it was previously dropped, so a user
  // bounced to /login from a deep link always landed on the dashboard instead.
  // Only relative paths are honoured, to avoid an open redirect.
  const redirectParam = searchParams.get('redirect');
  const safeRedirect =
    redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
      ? redirectParam
      : null; // Role passed from your signup page

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!exchangeError) {
      try {
        // Get the authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('User fetch error:', userError);
          return NextResponse.redirect(`${origin}/login?error=user`);
        }

        // Determine role: URL param (from your signup) > metadata > default
        const userRole = role || user.user_metadata?.role || 'student';

        // Check if profile exists
        const { data: existingProfile, error: profileFetchError } = await supabase
          .from('user_profiles')
          .select('user_id, onboarding_completed, user_type')
          .eq('user_id', user.id)
          .single();

        if (profileFetchError && profileFetchError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileFetchError);
        }

        // Create or update profile
        if (!existingProfile) {
          // Create new profile
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              email: user.email,
              name: deriveDisplayName(user),
              user_type: userRole,
              onboarding_completed: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error('Profile creation error:', insertError);
            // Continue anyway - we'll redirect to onboarding
          }

          // New user - always go to onboarding
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        // Profile exists - check if we need to update role
        if (!existingProfile.user_type && userRole) {
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              user_type: userRole,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

          if (updateError) {
            console.error('Profile update error:', updateError);
          }
        }

        // Redirect based on onboarding status
        if (existingProfile.onboarding_completed) {
          // Already onboarded - go to appropriate dashboard
          const dashboardRoute =
            safeRedirect || getDashboardRoute(existingProfile.user_type || userRole);
          return NextResponse.redirect(`${origin}${dashboardRoute}`);
        } else {
          // Need onboarding
          return NextResponse.redirect(`${origin}/onboarding`);
        }

      } catch (error) {
        console.error('Profile handling error:', error);
        // Still redirect to onboarding even if profile creation fails
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    } else {
      console.error('Code exchange error:', exchangeError);
    }
  }

  // Return to login on error
  return NextResponse.redirect(`${origin}/login?error=auth`);
}

function getDashboardRoute(userType: string): string {
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
}
