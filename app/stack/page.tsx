'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Pet {
  id: string
  name: string
  species: string
  breed: string | null
  avatar_url: string | null
  bio: string | null
  owner_id: string
}

interface UserProfile {
  username: string | null
}

export default function StackPage() {
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [owner, setOwner] = useState<UserProfile | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [boopCount, setBoopCount] = useState(0)
  const [justBooped, setJustBooped] = useState(false)

  useEffect(() => {
    const loadStack = async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          router.push('/login')
          return
        }

        setUser(userData.user as { id: string })

        const { data: allPets } = await supabase
          .from('pets')
          .select('*')
          .neq('owner_id', userData.user.id)
          .order('created_at', { ascending: false })

        setPets(allPets || [])
        setLoading(false)
      } catch (err) {
        console.error('Stack load error:', err)
        setLoading(false)
      }
    }

    loadStack()
  }, [router])

  useEffect(() => {
    const loadOwner = async () => {
      if (currentIndex < pets.length && user) {
        const currentPet = pets[currentIndex]
        try {
          const supabase = createClient()
          const { data: ownerData } = await supabase
            .from('users')
            .select('username')
            .eq('id', currentPet.owner_id)
            .single()
          setOwner(ownerData)
        } catch (err) {
          console.error('Owner fetch error:', err)
        }
      }
    }
    loadOwner()
  }, [currentIndex, pets, user])

  const handleBoop = async () => {
    if (currentIndex >= pets.length || !user) return
    const currentPet = pets[currentIndex]

    setJustBooped(true)
    setBoopCount(prev => prev + 1)

    setTimeout(() => setJustBooped(false), 300)

    try {
      const supabase = createClient()
      await supabase.from('boops').insert({ pet_id: currentPet.id, user_id: user.id })
    } catch (err) {
      console.error('Boop error:', err)
    }
  }

  const advanceCard = () => {
    setCurrentIndex(prev => {
      const next = prev + 1
      return next >= pets.length ? pets.length : next
    })
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--app-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: 'var(--ink-2)' }}>Loading...</p>
      </div>
    )
  }

  const currentPet = currentIndex < pets.length ? pets[currentIndex] : null

  if (!currentPet) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--app-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</p>
        <h1 style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: '32px',
          fontWeight: 400,
          fontStyle: 'italic',
          color: 'var(--ink)',
          marginBottom: '12px',
          textAlign: 'center',
        }}>
          You've seen them all!
        </h1>
        <p style={{
          fontSize: '13px',
          color: 'var(--ink-2)',
          marginBottom: '32px',
          textAlign: 'center',
          maxWidth: '300px',
        }}>
          Check back later for more pets to discover.
        </p>
        <Link href="/profile" style={{
          padding: '12px 28px',
          background: 'var(--ink)',
          color: '#fff',
          textDecoration: 'none',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.5px',
          borderRadius: '0px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 180ms ease',
          display: 'inline-block',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)')}
        >
          View Your Pets
        </Link>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--app-bg)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 20px',
      paddingBottom: '100px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '28px',
        marginTop: '12px',
      }}>
        <div>
          <p style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'var(--acc)',
            margin: '0 0 4px 0',
          }}>
            Stack
          </p>
          <p style={{
            fontSize: '12px',
            color: 'var(--ink-2)',
            margin: 0,
            fontWeight: 500,
          }}>
            {currentIndex + 1} of {pets.length}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '0px',
            background: 'transparent',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 160ms ease',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.12)', e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.06)', e.currentTarget.style.background = 'transparent')}
        >
          ↪
        </button>
      </div>

      {/* Main Card Stack */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '440px',
        margin: '0 auto',
        width: '100%',
        position: 'relative',
      }}>
        {/* Ghost cards (stacked effect) */}
        {currentIndex + 1 < pets.length && (
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '500px',
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: '0px',
            top: '8px',
            left: '4px',
            zIndex: 0,
            opacity: 0.4,
          }} />
        )}
        {currentIndex + 2 < pets.length && (
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '500px',
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: '0px',
            top: '16px',
            left: '8px',
            zIndex: 0,
            opacity: 0.2,
          }} />
        )}

        {/* Main Card */}
        <div style={{
          background: 'var(--paper)',
          borderRadius: '0px',
          border: '1px solid var(--line)',
          padding: '28px 24px 32px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
          minHeight: '540px',
        }}>
          {/* Avatar */}
          <div style={{
            width: '100%',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'center',
          }}>
            <div style={{
              width: '140px',
              height: '140px',
              borderRadius: '0px',
              background: '#e5e1d7',
              backgroundImage: currentPet.avatar_url ? `url(${currentPet.avatar_url})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '2px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
            }}>
              {!currentPet.avatar_url && '🐾'}
            </div>
          </div>

          {/* Pet Info */}
          <h2 style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: '40px',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--ink)',
            margin: '0 0 6px 0',
            lineHeight: 1.1,
            textAlign: 'center',
          }}>
            {currentPet.name}
          </h2>

          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'var(--ink-2)',
            margin: '0 0 18px 0',
            textAlign: 'center',
          }}>
            {currentPet.species}
            {currentPet.breed && ` · ${currentPet.breed}`}
          </p>

          {/* Bio */}
          {currentPet.bio && (
            <p style={{
              fontSize: '13px',
              color: 'var(--ink)',
              lineHeight: 1.7,
              fontStyle: 'italic',
              margin: '0 0 24px 0',
              paddingLeft: '12px',
              borderLeft: '3px solid var(--acc)',
            }}>
              "{currentPet.bio}"
            </p>
          )}

          {/* Owner - bottom */}
          <div style={{
            marginTop: 'auto',
            paddingTop: '16px',
            borderTop: '1px solid var(--line)',
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: 'var(--ink-2)',
              margin: '0 0 4px 0',
            }}>
              Owner
            </p>
            <p style={{
              fontSize: '13px',
              color: 'var(--ink)',
              margin: 0,
              fontWeight: 500,
            }}>
              @{owner?.username || '—'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginTop: '20px',
          position: 'relative',
          zIndex: 2,
        }}>
          {/* Boop Button */}
          <button
            onClick={handleBoop}
            style={{
              padding: '16px 14px',
              background: justBooped ? 'var(--acc)' : 'var(--ink)',
              color: '#fff',
              border: 'none',
              borderRadius: '0px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.4px',
              transition: 'all 160ms ease',
              boxShadow: justBooped
                ? '0 8px 20px rgba(217, 119, 87, 0.35)'
                : '0 4px 12px rgba(0, 0, 0, 0.15)',
              transform: justBooped ? 'scale(1.04)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (!justBooped) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)'
              }
            }}
            onMouseLeave={(e) => {
              if (!justBooped) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
              }
            }}
          >
            👉 Boop {boopCount > 0 && `(${boopCount})`}
          </button>

          {/* Next Button */}
          <button
            onClick={advanceCard}
            style={{
              padding: '16px 14px',
              background: 'transparent',
              color: 'var(--ink)',
              border: '1px solid var(--line)',
              borderRadius: '0px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.4px',
              transition: 'all 160ms ease',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(24, 24, 27, 0.04)', e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.04)')}
          >
            Next →
          </button>
        </div>

        {/* View Full Card Link */}
        <Link
          href={`/pets/${currentPet.id}`}
          style={{
            marginTop: '12px',
            padding: '10px 16px',
            background: 'transparent',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.3px',
            borderRadius: '0px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 160ms ease',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(24, 24, 27, 0.02)', e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.04)')}
        >
          View Full Card
        </Link>
      </div>

      {/* Tab Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '76px',
        paddingTop: '8px',
        paddingBottom: '12px',
        background: 'rgba(250, 250, 247, 0.92)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--line)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
      }}>
        {[
          { emoji: '📚', label: 'Stack', href: '/stack', active: true },
          { emoji: '🏆', label: 'Shelf', href: '/profile', active: false },
        ].map(tab => (
          <Link key={tab.label} href={tab.href} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            textDecoration: 'none',
            opacity: tab.active ? 1 : 0.5,
            transition: 'opacity 160ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = tab.active ? '1' : '0.5')}
          >
            <span style={{ fontSize: '20px' }}>{tab.emoji}</span>
            <span style={{
              fontSize: '9px',
              fontWeight: 600,
              color: tab.active ? 'var(--acc)' : 'var(--ink)',
              letterSpacing: '0.4px',
            }}>
              {tab.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
