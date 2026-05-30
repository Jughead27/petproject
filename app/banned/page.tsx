'use client'

import { createClient } from '@supabase/auth-js'
import { useRouter } from 'next/navigation'

export default function BannedPage() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      await supabase.auth.signOut()
      router.push('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--app-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <p style={{ fontSize: '64px', marginBottom: '16px' }}>🚫</p>
        <h1 style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: '32px',
          fontWeight: 400,
          fontStyle: 'italic',
          color: 'var(--ink)',
          marginBottom: '12px',
          lineHeight: 1,
        }}>
          Account Suspended
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--ink-2)',
          marginBottom: '32px',
          lineHeight: 1.6,
        }}>
          Your account has been suspended due to a violation of our community guidelines. If you believe this is a mistake, please contact our support team.
        </p>
        <button
          onClick={handleLogout}
          style={{
            padding: '12px 28px',
            background: 'var(--ink)',
            color: '#fff',
            border: 'none',
            borderRadius: '0px',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'all 160ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)')}
        >
          Logout
        </button>
      </div>
    </div>
  )
}
