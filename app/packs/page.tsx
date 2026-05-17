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
      <div className="min-h-screen bg-app flex items-center justify-center">
        <p style={{ color: 'var(--ink-2)' }}>Loading packs...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-app pb-20" style={{
      backgroundImage: `
        radial-gradient(circle at 20% 20%, rgba(217, 119, 87, 0.08), transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(90, 122, 154, 0.06), transparent 50%)
      `
    }}>
      {/* Header */}
      <div className="flex justify-between items-start p-6" style={{ paddingTop: 'var(--space-8)' }}>
        <div>
          <p className="kicker" style={{ color: 'var(--acc)' }}>SNOUT</p>
          <h1 className="display-lg" style={{ color: 'var(--ink)' }}>Packs</h1>
          <p className="text-xs" style={{ color: 'var(--ink-2)', marginTop: '4px' }}>
            Collections coming soon
          </p>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="flex flex-col items-center justify-center px-6 py-12">
        <p className="text-4xl mb-6">📦</p>
        <h2 className="display-lg" style={{ color: 'var(--ink)', marginBottom: '12px', textAlign: 'center' }}>
          Packs Coming Soon
        </h2>
        <p className="text-sm text-center" style={{ color: 'var(--ink-2)', maxWidth: '300px', marginBottom: '24px' }}>
          Create and share collections of your favorite pets. This feature is in development.
        </p>
        <Link
          href="/stack"
          className="px-6 py-2 rounded-lg button-text"
          style={{ background: 'var(--acc)', color: '#fff' }}
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
          <Link key={tab.label} href={tab.href} className="flex flex-col items-center gap-0.5" style={{ opacity: tab.active ? 1 : 0.45 }}>
            <span style={{ fontSize: '22px' }}>{tab.emoji}</span>
            <span className="text-xs font-medium" style={{ color: tab.active ? 'var(--acc)' : 'var(--ink)' }}>{tab.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
