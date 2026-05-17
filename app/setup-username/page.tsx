'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SetupUsernamePage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkExisting = async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()

        if (!userData.user) {
          router.push('/login')
          return
        }

        // Check if user already has a username
        const { data: existingUser } = await supabase
          .from('users')
          .select('username')
          .eq('id', userData.user.id)
          .single()

        if (existingUser?.username) {
          // User already has username, redirect to onboarding
          router.push('/onboarding')
          return
        }

        setChecking(false)
      } catch (err) {
        console.error('Setup check error:', { timestamp: new Date().toISOString() })
        setChecking(false)
      }
    }

    checkExisting()
  }, [router])

  const handleSetUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!username.trim()) {
      setError('Please enter a username')
      return
    }

    const cleanUsername = username.trim().toLowerCase()

    // Username format: lowercase letters, numbers, underscores, 3-20 chars
    const usernameRegex = /^[a-z0-9_]{3,20}$/
    if (!usernameRegex.test(cleanUsername)) {
      setError(
        'Username must be 3-20 characters (letters, numbers, underscores only)'
      )
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data: authUser } = await supabase.auth.getUser()

      if (!authUser.user) {
        setError('Not authenticated')
        return
      }

      // Try to insert username into users table
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          username: cleanUsername,
        })

      if (insertError) {
        if (insertError.message.includes('duplicate') || insertError.code === '23505') {
          setError('This username is already taken')
        } else {
          setError('Could not set username. Please try again.')
        }
        return
      }

      // Success, redirect to onboarding
      router.push('/onboarding')
    } catch (err) {
      console.error('Username setup error:', { timestamp: new Date().toISOString() })
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--app-bg)',
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(217, 119, 87, 0.08), transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(90, 122, 154, 0.06), transparent 50%)
        `,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '360px',
          background: 'var(--paper)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--line)',
          padding: '32px',
        }}>
          <p style={{ color: 'var(--ink-2)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--app-bg)',
      backgroundImage: `
        radial-gradient(circle at 20% 20%, rgba(217, 119, 87, 0.08), transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(90, 122, 154, 0.06), transparent 50%)
      `,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '360px',
        background: 'var(--paper)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--line)',
        padding: '32px',
      }}>
        <h1 className="display-lg" style={{ color: 'var(--ink)', marginBottom: '8px' }}>Choose your username</h1>
        <p className="text-sm" style={{ color: 'var(--ink-2)', marginBottom: '24px', lineHeight: 1.5 }}>
          This is how other pet owners will find you on PetProject.
        </p>

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

        <form onSubmit={handleSetUsername} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label htmlFor="username" className="label" style={{ display: 'block', color: 'var(--ink)', marginBottom: '6px' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '10px',
                color: 'var(--ink-2)',
                fontSize: '14px',
              }}>@</span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  paddingLeft: '30px',
                  paddingRight: '12px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--ink)',
                  backgroundColor: 'var(--paper)',
                  fontSize: '14px',
                  opacity: loading ? 0.5 : 1,
                }}
                placeholder="yourname"
              />
            </div>
            <p className="text-xs" style={{ color: 'var(--ink-2)', marginTop: '6px' }}>
              3-20 characters, letters/numbers/underscores
            </p>
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
            {loading ? 'Setting username...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
