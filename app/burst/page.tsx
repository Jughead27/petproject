'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function BurstPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [playingFrame, setPlayingFrame] = useState(0)
  const [paused, setPaused] = useState(false)

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

  useEffect(() => {
    if (paused || !loading) return
    const interval = setInterval(() => {
      setPlayingFrame(prev => (prev + 1) % 6)
    }, 133)
    return () => clearInterval(interval)
  }, [paused, loading])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--app-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: 'var(--ink-2)' }}>Loading burst...</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Photo */}
      <div style={{
        flex: '0 0 62%',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent 40%, transparent 60%, #fafaf7)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <img
          src={`https://picsum.photos/340/400?random=${playingFrame}`}
          alt="burst frame"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Header */}
        <div style={{ position: 'absolute', top: '50px', left: '18px', right: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2.5px', marginBottom: '3px' }}>PAWPARAZZI</p>
            <h1 style={{ fontFamily: '"Instrument Serif", serif', fontSize: '22px', fontStyle: 'italic', lineHeight: 1, marginBottom: '3px' }}>@biscuit · 6 frames</h1>
            <p style={{ fontSize: '10px', opacity: 0.7 }}>0.8s loop · backyard derby</p>
          </div>
          <button
            onClick={() => router.back()}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.18)',
              border: '0.5px solid rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(12px)',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {/* Boop Annotation */}
        <div style={{ position: 'absolute', top: '32%', right: '20px', textAlign: 'center' }}>
          <p style={{ fontFamily: '"Instrument Serif", serif', fontSize: '42px', fontStyle: 'italic', color: 'var(--acc)', transform: 'rotate(-8deg)', textShadow: '1px 1px 0 #fff', margin: 0 }}>boop!</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff', opacity: 0.85, marginTop: '6px', marginLeft: '30px' }}>+47</p>
        </div>
      </div>

      {/* Filmstrip */}
      <div style={{
        flex: '0 0 auto',
        height: '90px',
        background: '#0a0a0a',
        borderTop: '1px dashed rgba(255, 255, 255, 0.2)',
        padding: '12px 14px',
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
      }}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            onClick={() => { setPlayingFrame(i); setPaused(true) }}
            style={{
              flex: 1,
              aspectRatio: '3/4',
              borderRadius: '6px',
              overflow: 'hidden',
              cursor: 'pointer',
              border: playingFrame === i ? '1.5px solid var(--acc)' : '1px solid rgba(255, 255, 255, 0.15)',
              position: 'relative',
            }}
          >
            <img
              src={`https://picsum.photos/60/80?random=${i}`}
              alt={`frame ${i}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <span style={{
              position: 'absolute',
              top: '2px',
              left: '4px',
              fontSize: '8px',
              fontWeight: 600,
              color: '#fff',
              textShadow: '0 1px 2px #000',
            }}>
              {i + 1}
            </span>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ flex: '1', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: '110px', gap: '16px' }}>
        {[
          { emoji: '👉', label: 'Boop' },
          { emoji: '📌', label: 'Stash' },
          { emoji: '🐾', label: 'Follow' },
          { emoji: '↪', label: 'Pass' },
        ].map(action => (
          <div key={action.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-xl)',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '0.5px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              cursor: 'pointer',
            }}>
              {action.emoji}
            </div>
            <span style={{ fontSize: '10px', fontWeight: 500, color: '#fff' }}>{action.label}</span>
          </div>
        ))}
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
        background: 'rgba(10, 10, 10, 0.92)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '0.5px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
      }}>
        {[
          { emoji: '📚', label: 'Stack', href: '/stack', active: false },
          { emoji: '📖', label: 'Dex', href: '/dex', active: false },
          { emoji: '📸', label: 'Burst', href: '/burst', active: true },
          { emoji: '🐾', label: 'Packs', href: '/packs', active: false },
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
              color: '#fff',
            }}>
              {tab.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
