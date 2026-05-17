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
      <div style={{ textAlign: 'center' }}>
        <h1 className="display-lg" style={{ color: 'var(--ink)', marginBottom: '8px' }}>Check your email</h1>
        <p className="text-sm" style={{ color: 'var(--ink-2)', marginBottom: '16px' }}>
          We sent a confirmation link to <strong>{email}</strong>
        </p>
        <p className="text-xs" style={{ color: 'var(--ink-2)' }}>
          Click the link in your email to complete signup.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="display-lg" style={{ color: 'var(--ink)', marginBottom: '24px' }}>Join PetProject</h1>

      {searchParams.get('error') === 'invalid_invite' && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 14px',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '11.5px',
          color: '#7f1d1d',
        }}>
          Your invite link is invalid or has expired. Check your email for a new one.
        </div>
      )}

      {error && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 14px',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '11.5px',
          color: '#7f1d1d',
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="email" className="label" style={{ display: 'block', color: 'var(--ink)', marginBottom: '6px' }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--ink)',
              backgroundColor: 'var(--paper)',
              fontSize: '14px',
              opacity: loading ? 0.5 : 1,
            }}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="label" style={{ display: 'block', color: 'var(--ink)', marginBottom: '6px' }}>
            Password (minimum 12 characters)
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--ink)',
              backgroundColor: 'var(--paper)',
              fontSize: '14px',
              opacity: loading ? 0.5 : 1,
            }}
            placeholder="••••••••••••"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="label"
            style={{ display: 'block', color: 'var(--ink)', marginBottom: '6px' }}
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--ink)',
              backgroundColor: 'var(--paper)',
              fontSize: '14px',
              opacity: loading ? 0.5 : 1,
            }}
            placeholder="••••••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="button-text"
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '8px',
            background: 'var(--acc)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 200ms',
          }}
        >
          {loading ? 'Creating account...' : 'Sign up'}
        </button>
      </form>

      <p className="text-xs" style={{ color: 'var(--ink-2)', textAlign: 'center', marginTop: '24px' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--acc)', textDecoration: 'none' }}>
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
