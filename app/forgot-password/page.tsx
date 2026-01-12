'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Κάτι πήγε στραβά. Προσπάθησε ξανά.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#191308]">
        <div className="w-full max-w-md text-center">
          <div className="bg-[#1E1E24] rounded-2xl border border-[#454551] p-8">
            <div className="w-16 h-16 bg-[#4EA6DC]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#4EA6DC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-heading font-semibold text-white mb-2">
              Έλεγξε το email σου
            </h2>
            <p className="text-[#D8D9DC] mb-6 font-body">
              Σου στείλαμε οδηγίες για την επαναφορά του κωδικού στο{' '}
              <strong className="text-[#87F1FF]">{email}</strong>
            </p>
            <Link 
              href="/login"
              className="inline-block text-[#87F1FF] hover:text-[#4EA6DC] font-body font-medium"
            >
              ← Πίσω στη σύνδεση
            </Link>
          </div>
        </div>
      </div>
    )
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
        </div>

        {/* Form */}
        <div className="bg-[#1E1E24] rounded-2xl border border-[#454551] p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-heading font-semibold text-white mb-2">
              Ξέχασες τον κωδικό;
            </h1>
            <p className="text-[#D8D9DC] font-body text-sm">
              Εισάγε το email σου και θα σου στείλουμε οδηγίες για την επαναφορά.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#4EA6DC] to-[#113285] hover:from-[#87F1FF] hover:to-[#4EA6DC] disabled:from-[#454551] disabled:to-[#454551] text-white py-3 rounded-lg font-body font-medium transition-all"
            >
              {loading ? 'Αποστολή...' : 'Αποστολή οδηγιών'}
            </button>
          </form>

          <p className="text-center text-[#D8D9DC] text-sm mt-6 font-body">
            Θυμήθηκες τον κωδικό;{' '}
            <Link href="/login" className="text-[#87F1FF] hover:text-[#4EA6DC] font-medium">
              Σύνδεση
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
