'use client'

import Link from 'next/link'

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-6" style={{
      backgroundImage: `
        radial-gradient(circle at 20% 20%, rgba(217, 119, 87, 0.08), transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(90, 122, 154, 0.06), transparent 50%)
      `
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p className="kicker" style={{ color: 'var(--acc)', marginBottom: '12px' }}>SNOUT</p>
          <h1 className="display-lg" style={{ color: 'var(--ink)', marginBottom: '12px' }}>
            Welcome
          </h1>
          <p className="text-sm" style={{ color: 'var(--ink-2)', lineHeight: 1.6 }}>
            PetProject is better with a pet card. Add yours, or explore first?
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          <Link href="/pets/create" style={{ textDecoration: 'none' }}>
            <button className="w-full button-text" style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--acc)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 200ms',
            }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
              🐾 Add my first pet
            </button>
          </Link>

          <Link href="/stack" style={{ textDecoration: 'none' }}>
            <button className="w-full button-text" style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              color: 'var(--ink)',
              border: '1px solid var(--line)',
              cursor: 'pointer',
              transition: 'background 200ms',
            }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              👀 Browse first, add pet later
            </button>
          </Link>
        </div>

        <p className="text-xs text-center" style={{ color: 'var(--ink-2)' }}>
          You can always add a pet later from your profile.
        </p>
      </div>
    </div>
  )
}
