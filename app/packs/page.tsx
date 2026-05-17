'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PacksPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string } | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }
      setUser(userData.user as { id: string })
      setLoading(false)
    }
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--app-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: 'var(--ink-2)' }}>Loading packs...</p>
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
      paddingBottom: '100px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '24px',
        paddingTop: '18px',
      }}>
        <div>
          <p className="kicker" style={{ color: 'var(--acc)' }}>SNOUT</p>
          <h1 className="display-lg" style={{ color: 'var(--ink)' }}>Packs</h1>
          <p className="text-xs" style={{ color: 'var(--ink-2)', marginTop: '4px' }}>
            Collections coming soon
          </p>
        </div>
      </div>

      {/* Placeholder Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: '24px',
        paddingRight: '24px',
        paddingTop: '48px',
        paddingBottom: '48px',
      }}>
        <p style={{ fontSize: '32px', marginBottom: '24px' }}>📦</p>
        <h2 style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: '28px',
          fontWeight: 400,
          fontStyle: 'italic',
          color: 'var(--ink)',
          marginBottom: '12px',
          textAlign: 'center',
          lineHeight: 1,
        }}>
          Packs Coming Soon
        </h2>
        <p style={{
          fontSize: '11.5px',
          textAlign: 'center',
          color: 'var(--ink-2)',
          maxWidth: '300px',
          marginBottom: '24px',
          lineHeight: 1.3,
        }}>
          Create and share collections of your favorite pets. This feature is in development.
        </p>
        <Link
          href="/stack"
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            background: 'var(--acc)',
            color: '#fff',
            textDecoration: 'none',
            fontSize: '12.5px',
            fontWeight: 600,
          }}
        >
          Back to Stack
        </Link>
      </div>

      {/* Tab Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '82px',
        paddingTop: 'var(--space-3)',
        paddingBottom: 'var(--space-6)',
        background: 'rgba(250, 250, 247, 0.92)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '0.5px solid rgba(0, 0, 0, 0.08)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
      }}>
        {[
          { emoji: '📚', label: 'Stack', href: '/stack', active: false },
          { emoji: '📖', label: 'Dex', href: '/dex', active: false },
          { emoji: '📸', label: 'Burst', href: '/burst', active: false },
          { emoji: '🐾', label: 'Packs', href: '/packs', active: true },
          { emoji: '🏆', label: 'Shelf', href: '/profile', active: false },
        ].map(tab => (
          <Link
            key={tab.label}
            href={tab.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none',
              opacity: tab.active ? 1 : 0.45,
            }}
          >
            <span style={{ fontSize: '22px' }}>{tab.emoji}</span>
            <span style={{
              fontSize: '10.5px',
              fontWeight: 600,
              color: tab.active ? 'var(--acc)' : 'var(--ink)',
            }}>
              {tab.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
