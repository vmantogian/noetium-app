import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentDashboard from '@/components/StudentDashboard'

export default async function StudentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if onboarding completed
  const onboardingCompleted = user.user_metadata?.onboarding_completed
  
  // If onboarding not completed, redirect
  // (Optional - you can enable this after adding onboarding)
  // if (!onboardingCompleted) {
  //   redirect('/onboarding')
  // }

  // Get student profile if exists
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return <StudentDashboard user={user} profile={profile || undefined} />
}
