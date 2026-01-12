import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if user completed onboarding
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.user_metadata?.onboarding_completed) {
        // Existing user - go to student dashboard
        return NextResponse.redirect(`${origin}/student`)
      } else {
        // New user - go to onboarding
        return NextResponse.redirect(`${origin}/onboarding`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
