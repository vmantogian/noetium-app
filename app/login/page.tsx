'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message === 'Invalid login credentials' 
          ? 'Λάθος email ή κωδικός' 
          : error.message)
      } else {
        router.push('/chat')
        router.refresh()
      }
    } catch (err) {
      setError('Κάτι πήγε στραβά. Προσπάθησε ξανά.')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'azure') => {
    setSocialLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(`Σφάλμα σύνδεσης με ${provider}`)
      setSocialLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#191308]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2 sm:gap-3">
            <Logo size={50} className="sm:w-[60px] sm:h-[60px]" />
            <span className="text-xl sm:text-2xl font-heading font-semibold text-white">Noetium</span>
          </Link>
          <p className="text-[#D8D9DC] mt-2 font-body text-sm sm:text-base">
            Καλώς ήρθες πίσω!
          </p>
        </div>

        {/* Form */}
        <div className="bg-[#1E1E24] rounded-2xl border border-[#454551] p-6 sm:p-8">
          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleSocialLogin('google')}
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
              onClick={() => handleSocialLogin('apple')}
              disabled={socialLoading !== null}
              className="w-full flex items-center justify-center gap-3 bg-black hover:bg-gray-900 disabled:bg-gray-800 text-white py-3 rounded-lg font-body font-medium transition-all"
            >
              {socialLoading === 'apple' ? (
                <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              )}
              Συνέχεια με Apple
            </button>

            <button
              onClick={() => handleSocialLogin('azure')}
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

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-[#E32D91]/10 border border-[#E32D91]/30 text-[#E32D91] p-3 rounded-lg text-sm font-body">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-body font-medium text-[#D8D9DC] mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#454551] bg-[#191308] text-white placeholder-[#454551] focus:ring-2 focus:ring-[#4EA6DC] focus:border-transparent transition-all font-body"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-body font-medium text-[#D8D9DC]">
                  Κωδικός
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-[#87F1FF] hover:text-[#4EA6DC] font-body"
                >
                  Ξέχασες τον κωδικό;
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#454551] bg-[#191308] text-white placeholder-[#454551] focus:ring-2 focus:ring-[#4EA6DC] focus:border-transparent transition-all font-body"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#4EA6DC] to-[#113285] hover:from-[#87F1FF] hover:to-[#4EA6DC] disabled:from-[#454551] disabled:to-[#454551] text-white py-3 rounded-lg font-body font-medium transition-all"
            >
              {loading ? 'Σύνδεση...' : 'Σύνδεση'}
            </button>
          </form>

          <p className="text-center text-[#D8D9DC] text-sm mt-6 font-body">
            Δεν έχεις λογαριασμό;{' '}
            <Link href="/signup" className="text-[#87F1FF] hover:text-[#4EA6DC] font-medium">
              Κάνε εγγραφή
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
