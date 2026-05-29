'use client'

import Link from 'next/link'

export default function OnboardingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--app-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <p style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'var(--acc)',
            margin: '0 0 12px 0',
          }}>
            Welcome
          </p>
          <h1 style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: '36px',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--ink)',
            margin: '0 0 12px 0',
            lineHeight: 1.1,
          }}>
            PetProject
          </h1>
          <p style={{
            fontSize: '13px',
            color: 'var(--ink-2)',
            lineHeight: 1.6,
            margin: 0,
          }}>
            Add your pet card or browse the stack first?
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          <Link href="/pets/create" style={{ textDecoration: 'none' }}>
            <button style={{
              width: '100%',
              padding: '16px',
              borderRadius: '0px',
              background: 'var(--acc)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 160ms ease',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.4px',
              boxShadow: '0 4px 12px rgba(8, 145, 178, 0.2)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 6px 16px rgba(8, 145, 178, 0.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 145, 178, 0.2)')}
            >
              🐾 Add my first pet
            </button>
          </Link>

          <Link href="/stack" style={{ textDecoration: 'none' }}>
            <button style={{
              width: '100%',
              padding: '16px',
              borderRadius: '0px',
              background: 'transparent',
              color: 'var(--ink)',
              border: '1px solid var(--line)',
              cursor: 'pointer',
              transition: 'all 160ms ease',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.4px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)', e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.04)')}
            >
              👀 Browse first, add later
            </button>
          </Link>
        </div>

        <p style={{
          fontSize: '11px',
          textAlign: 'center',
          color: 'var(--ink-2)',
          margin: 0,
        }}>
          You can always add a pet later from your profile.
        </p>
      </div>
    </div>
  )
}
