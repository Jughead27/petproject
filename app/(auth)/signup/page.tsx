'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Store invite token from URL in localStorage
  useEffect(() => {
    const inviteParam = searchParams.get('invite')
    if (inviteParam) {
      try {
        localStorage.setItem('petproject_invite_token', inviteParam)
      } catch (err) {
        console.error('Failed to store invite token:', err)
      }
    }
  }, [searchParams])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 12) {
      setError('Password must be at least 12 characters')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    // Get invite token from localStorage
    const inviteToken = localStorage.getItem('petproject_invite_token')

    if (!inviteToken) {
      setError('No valid invite found')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Verify invite is still valid (hasn't been used)
      const { data: invites, error: inviteCheckError } = await supabase
        .from('invites')
        .select('id, used_by')
        .eq('token', inviteToken)
        .single()

      if (inviteCheckError || !invites || invites.used_by) {
        setError('Your invite is no longer valid')
        return
      }

      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signupError) {
        if (signupError.message.includes('already registered')) {
          setError('This email is already registered')
        } else {
          setError(signupError.message || 'Signup failed')
        }
        return
      }

      // Mark invite as used via API route
      if (signupData.user) {
        try {
          await fetch('/api/invites/mark-used', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: inviteToken,
              userId: signupData.user.id,
            }),
          })
          // Clear localStorage after marking as used
          localStorage.removeItem('petproject_invite_token')
        } catch (err) {
          console.error('Failed to mark invite as used:', err)
          // Don't fail signup if we can't mark invite, just log it
        }
      }

      setSubmitted(true)
    } catch (err) {
      console.error('Signup error:', { timestamp: new Date().toISOString() })
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
        <p className="text-gray-600 mb-6">
          We sent a confirmation link to <strong>{email}</strong>
        </p>
        <p className="text-sm text-gray-500">
          Click the link in your email to complete signup.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Join PetProject</h1>

      {searchParams.get('error') === 'invalid_invite' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          Your invite link is invalid or has expired. Check your email for a new one.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password (minimum 12 characters)
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            placeholder="••••••••••••"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            placeholder="••••••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Creating account...' : 'Sign up'}
        </button>
      </form>

      <p className="text-sm text-gray-600 text-center mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-amber-600 hover:text-amber-700 font-medium">
          Log in
        </Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
      <SignupContent />
    </Suspense>
  )
}
