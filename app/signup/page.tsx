'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'

function SignupForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam && ['student', 'teacher', 'parent'].includes(roleParam)) {
      setRole(roleParam)
    }
  }, [searchParams])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 6) {
      setError('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setError('Αυτό το email χρησιμοποιείται ήδη')
        } else {
          setError(error.message)
        }
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Κάτι πήγε στραβά. Προσπάθησε ξανά.')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialSignup = async (provider: 'google' | 'azure') => {
    setSocialLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(`Σφάλμα σύνδεσης με ${provider === 'azure' ? 'Microsoft' : 'Google'}`)
      setSocialLoading(null)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="bg-[#1E1E24] rounded-2xl border border-[#454551] p-8">
          <div className="w-16 h-16 bg-[#4EA6DC]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#4EA6DC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-heading font-semibold text-white mb-2">
            Έλεγξε το email σου!
          </h2>
          <p className="text-[#D8D9DC] mb-6 font-body">
            Σου στείλαμε ένα link επιβεβαίωσης στο <strong className="text-[#87F1FF]">{email}</strong>. 
            Κάνε κλικ στο link για να ολοκληρώσεις την εγγραφή.
          </p>
          <Link 
            href="/login"
            className="text-[#87F1FF] hover:text-[#4EA6DC] font-body font-medium"
          >
            Πήγαινε στη σύνδεση →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex flex-col items-center gap-2">
          <Logo size={50} />
          <span className="text-xl font-heading font-semibold text-white">Noetium</span>
        </Link>
      </div>

      {/* Form */}
      <div className="bg-[#1E1E24] rounded-2xl border border-[#454551] p-6 sm:p-8">
        {/* Role Selection */}
        <div className="flex gap-2 p-1 bg-[#191308] rounded-lg mb-6">
          {[
            { id: 'student', label: '🎓 Μαθητής' },
            { id: 'teacher', label: '👨‍🏫 Καθηγητής' },
            { id: 'parent', label: '👨‍👩‍👧 Γονέας' },
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-body transition-all ${
                role === r.id 
                  ? 'bg-[#4EA6DC] text-white' 
                  : 'text-[#D8D9DC] hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Social Login Buttons - Only Google and Microsoft */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleSocialSignup('google')}
            disabled={socialLoading !== null}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:bg-gray-200 text-gray-800 py-3 rounded-lg font-body font-medium transition-all"
          >
            {socialLoading === 'google' ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Συνέχεια με Google
          </button>

          <button
            onClick={() => handleSocialSignup('azure')}
            disabled={socialLoading !== null}
            className="w-full flex items-center justify-center gap-3 bg-[#2F2F2F] hover:bg-[#3a3a3a] disabled:bg-[#252525] text-white py-3 rounded-lg font-body font-medium transition-all"
          >
            {socialLoading === 'azure' ? (
              <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#F25022" d="M1 1h10v10H1z"/>
                <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                <path fill="#FFB900" d="M13 13h10v10H13z"/>
              </svg>
            )}
            Συνέχεια με Microsoft
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#454551]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#1E1E24] text-[#454551] font-body">ή με email</span>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="bg-[#E32D91]/10 border border-[#E32D91]/30 text-[#E32D91] p-3 rounded-lg text-sm font-body">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-body font-medium text-[#D8D9DC] mb-1">
              Όνομα
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[#454551] bg-[#191308] text-white placeholder-[#454551] focus:ring-2 focus:ring-[#4EA6DC] focus:border-transparent font-body"
              placeholder="Το όνομά σου"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-body font-medium text-[#D8D9DC] mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[#454551] bg-[#191308] text-white placeholder-[#454551] focus:ring-2 focus:ring-[#4EA6DC] focus:border-transparent font-body"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-body font-medium text-[#D8D9DC] mb-1">
              Κωδικός
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[#454551] bg-[#191308] text-white placeholder-[#454551] focus:ring-2 focus:ring-[#4EA6DC] focus:border-transparent font-body"
              placeholder="Τουλάχιστον 6 χαρακτήρες"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#E32D91] to-[#C830CC] hover:from-[#C830CC] hover:to-[#E32D91] disabled:from-[#454551] disabled:to-[#454551] text-white py-3 rounded-lg font-body font-medium transition-all"
          >
            {loading ? 'Εγγραφή...' : 'Δημιουργία Λογαριασμού'}
          </button>
        </form>

        <p className="text-center text-[#D8D9DC] text-sm mt-6 font-body">
          Έχεις ήδη λογαριασμό;{' '}
          <Link href="/login" className="text-[#87F1FF] hover:text-[#4EA6DC] font-medium">
            Σύνδεση
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#191308]">
      <Suspense fallback={
        <div className="w-full max-w-md flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#4EA6DC] border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <SignupForm />
      </Suspense>
    </div>
  )
}
