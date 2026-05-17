'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        if (loginError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password')
        } else {
          setError(loginError.message || 'Login failed')
        }
        return
      }

      if (!data.user) {
        setError('Login failed')
        return
      }

      // Redirect to setup-username; that page will check and redirect to /stack if username exists
      router.push('/setup-username')
    } catch (err) {
      console.error('Login error:', { timestamp: new Date().toISOString() })
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="display-lg" style={{ color: 'var(--ink)', marginBottom: '24px' }}>Welcome back</h1>

      {searchParams.get('error') === 'confirmation_failed' && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 14px',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '11.5px',
          color: '#7f1d1d',
        }}>
          Email confirmation failed. Please try signing up again or contact support.
        </div>
      )}

      {searchParams.get('error') === 'invalid_confirmation_link' && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 14px',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '11.5px',
          color: '#7f1d1d',
        }}>
          Invalid confirmation link. Please try signing up again.
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

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            Password
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
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="text-xs" style={{ color: 'var(--ink-2)', textAlign: 'center', marginTop: '24px', lineHeight: 1.5 }}>
        Don't have an account? Check your email for an invite link or ask a friend to send you one.
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
