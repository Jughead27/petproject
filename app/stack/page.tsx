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
  card_number: number | null
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
  const [noMore, setNoMore] = useState(false)
  const [counters, setCounters] = useState({ boops: 0, stashed: 0, packs: 0, cards: 0 })

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
        setNoMore(!allPets || allPets.length === 0)
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
    try {
      const supabase = createClient()
      await supabase.from('boops').insert({ pet_id: currentPet.id, user_id: user.id })
      setCounters(prev => ({ ...prev, boops: prev.boops + 1 }))
    } catch (err) {
      console.error('Boop error:', err)
    }
  }

  const handleStash = async () => {
    if (currentIndex >= pets.length || !user) return
    const currentPet = pets[currentIndex]
    try {
      const supabase = createClient()
      await supabase.from('stashes').insert({ pet_id: currentPet.id, user_id: user.id })
      setCounters(prev => ({ ...prev, stashed: prev.stashed + 1 }))
      advanceCard()
    } catch (err) {
      console.error('Stash error:', err)
    }
  }

  const advanceCard = () => {
    setCurrentIndex(prev => {
      const next = prev + 1
      if (next >= pets.length) setNoMore(true)
      return next
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
        <p style={{ color: 'var(--ink-2)', fontSize: '13.5px' }}>Loading pets...</p>
      </div>
    )
  }

  if (noMore || pets.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--app-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>🥺</p>
          <h1 style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: '28px',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--ink)',
            marginBottom: '16px',
            lineHeight: 1,
          }}>That&apos;s everyone for today</h1>
          <p style={{
            color: 'var(--ink-2)',
            marginBottom: '32px',
            maxWidth: '280px',
            margin: '0 auto 32px',
            fontSize: '13.5px',
            lineHeight: 1.4,
          }}>Come back later for more pets to discover. Or check out The Dex to see what you&apos;ve spotted.</p>
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            marginBottom: '32px',
          }}>
            <button onClick={() => { setCurrentIndex(0); setNoMore(false) }} style={{
              padding: '10px 24px',
              borderRadius: '12px',
              color: '#fff',
              background: 'var(--acc)',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}>
              Start over
            </button>
            <Link href="/dex" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '10px 24px',
                borderRadius: '12px',
                color: '#fff',
                background: 'var(--ink)',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}>
                The Dex
              </button>
            </Link>
          </div>
          <button onClick={handleLogout} style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink-2)',
            fontSize: '11.5px',
            cursor: 'pointer',
          }}>
            Log out
          </button>
        </div>
      </div>
    )
  }

  const currentPet = pets[currentIndex]
  const viewedToday = currentIndex + 1
  const dailyTarget = 12

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--app-bg)',
      backgroundImage: `
        radial-gradient(circle at 20% 20%, rgba(217, 119, 87, 0.08), transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(90, 122, 154, 0.06), transparent 50%)
      `,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '16px 24px',
        paddingTop: '16px',
      }}>
        <div>
          <p style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            lineHeight: 1,
            color: 'var(--acc)',
            margin: 0,
          }}>SNOUT</p>
          <h1 style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: '28px',
            fontWeight: 400,
            fontStyle: 'italic',
            lineHeight: 1,
            color: 'var(--ink)',
            margin: 0,
          }}>Stack</h1>
          <p style={{
            fontSize: '10.5px',
            fontWeight: 400,
            lineHeight: 1,
            color: 'var(--ink-2)',
            marginTop: '4px',
          }}>One card at a time · {String(viewedToday).padStart(2, '0')} / {dailyTarget} today</p>
        </div>
        <button style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'rgba(0, 0, 0, 0.06)',
          border: 'none',
          color: 'var(--ink)',
          cursor: 'pointer',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="7.5" cy="7.5" r="5.5" />
            <path d="M12 12l3.5 3.5" />
          </svg>
        </button>
      </div>

      {/* Card Stack Container */}
      <div style={{
        position: 'relative',
        maxWidth: '340px',
        height: '590px',
        margin: '0 auto',
        marginLeft: '26px',
        marginRight: '26px',
      }}>
        {/* Back peek cards */}
        <div style={{
          position: 'absolute',
          inset: '22px 38px 32px 38px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--line)',
          backgroundColor: 'var(--paper)',
          transform: 'rotate(-2.4deg)',
          opacity: 0.5,
          zIndex: 1,
        }} />
        <div style={{
          position: 'absolute',
          inset: '14px 30px 24px 30px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--line)',
          backgroundColor: 'var(--paper)',
          transform: 'rotate(1.8deg)',
          opacity: 0.78,
          zIndex: 2,
        }} />

        {/* Active Card */}
        <div style={{
          position: 'absolute',
          inset: '0 0 16px 0',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          backgroundColor: 'var(--paper)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transform: 'rotate(-0.5deg)',
          zIndex: 3,
        }}>
          {/* Photo Region */}
          <div style={{
            flex: 1,
            position: 'relative',
            backgroundColor: '#ddd',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {currentPet.avatar_url ? (
              <img src={currentPet.avatar_url} alt={currentPet.name} style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }} />
            ) : (
              <span style={{ fontSize: '48px' }}>🐾</span>
            )}

            {/* Corner Brackets */}
            {[
              { top: '14px', left: '14px', borderTop: '2px solid rgba(255, 255, 255, 0.7)', borderLeft: '2px solid rgba(255, 255, 255, 0.7)' },
              { top: '14px', right: '14px', borderTop: '2px solid rgba(255, 255, 255, 0.7)', borderRight: '2px solid rgba(255, 255, 255, 0.7)' },
              { bottom: '14px', left: '14px', borderBottom: '2px solid rgba(255, 255, 255, 0.7)', borderLeft: '2px solid rgba(255, 255, 255, 0.7)' },
              { bottom: '14px', right: '14px', borderBottom: '2px solid rgba(255, 255, 255, 0.7)', borderRight: '2px solid rgba(255, 255, 255, 0.7)' },
            ].map((bracket, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: '20px',
                height: '20px',
                ...bracket,
              }} />
            ))}

            {/* Card Number Pill */}
            <div style={{
              position: 'absolute',
              top: '14px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '5px 12px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(10px)',
            }}>
              <p style={{
                color: '#fff',
                letterSpacing: '1.5px',
                fontSize: '10.5px',
                fontWeight: 800,
                lineHeight: 1,
                margin: 0,
              }}>
                CARD · {String(viewedToday).padStart(2, '0')}/{String(dailyTarget).padStart(2, '0')}
              </p>
            </div>
          </div>

          {/* Meta Block */}
          <div style={{ padding: '16px 18px 14px' }}>
            {/* Name & Card Number */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: '8px',
              marginBottom: '8px',
            }}>
              <h2 style={{
                fontFamily: '"Instrument Serif", Georgia, serif',
                fontSize: '32px',
                fontWeight: 400,
                fontStyle: 'italic',
                lineHeight: 1,
                letterSpacing: '-0.5px',
                color: 'var(--ink)',
                margin: 0,
              }}>@{owner?.username || currentPet.name}</h2>
              <p style={{
                fontSize: '10.5px',
                color: 'var(--ink-2)',
                whiteSpace: 'nowrap',
                margin: 0,
              }}>#{currentPet.card_number} · {currentPet.species}</p>
            </div>

            {/* Breed Chip */}
            {currentPet.breed && (
              <div style={{ marginTop: '8px' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '3px 9px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(217, 119, 87, 0.12)',
                  color: 'var(--acc)',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  lineHeight: 1,
                }}>
                  {currentPet.breed}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Boop Button */}
        <button
          onClick={handleBoop}
          style={{
            position: 'absolute',
            width: '70px',
            height: '70px',
            top: '332px',
            right: '-4px',
            borderRadius: 'var(--radius-pill)',
            border: '4px solid var(--paper)',
            background: 'var(--acc)',
            boxShadow: 'var(--shadow-boop)',
            transform: 'rotate(-8deg)',
            zIndex: 10,
            fontSize: '26px',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '24px' }}>👉</span>
          <p style={{
            fontSize: '10.5px',
            fontWeight: 800,
            letterSpacing: '0.5px',
            lineHeight: 1,
            margin: 0,
          }}>BOOP</p>
        </button>
      </div>

      {/* Gesture Hints */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10.5px',
        marginTop: '16px',
        paddingLeft: '56px',
        paddingRight: '56px',
        color: 'var(--ink-2)',
      }}>
        <span>← their roll</span>
        <span style={{ fontWeight: 600, color: 'var(--acc)' }}>↑ next pet</span>
        <span>stash →</span>
      </div>

      {/* Counters Strip */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginTop: '16px',
        paddingLeft: '24px',
        paddingRight: '24px',
        maxWidth: '340px',
        margin: '16px auto 0',
      }}>
        {[
          { label: 'BOOPS', value: counters.boops },
          { label: 'STASHED', value: counters.stashed },
          { label: 'PACKS', value: counters.packs },
          { label: 'CARDS', value: counters.cards },
        ].map(counter => (
          <div key={counter.label} style={{
            flex: 1,
            textAlign: 'center',
            padding: '8px',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--paper)',
          }}>
            <p style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: '18px',
              fontWeight: 400,
              fontStyle: 'italic',
              lineHeight: 1,
              color: 'var(--ink)',
              margin: 0,
            }}>{counter.value}</p>
            <p style={{
              fontSize: '10.5px',
              fontWeight: 600,
              letterSpacing: '0.6px',
              lineHeight: 1,
              color: 'var(--ink-2)',
              marginTop: '3px',
              margin: '3px 0 0 0',
            }}>{counter.label}</p>
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
        paddingTop: '8px',
        paddingBottom: '14px',
        background: 'rgba(250, 250, 247, 0.92)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '0.5px solid rgba(0, 0, 0, 0.08)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
      }}>
        {[
          { emoji: '📚', label: 'Stack', href: '/stack', active: true },
          { emoji: '📖', label: 'Dex', href: '/dex', active: false },
          { emoji: '📸', label: 'Burst', href: '/burst', active: false },
          { emoji: '🐾', label: 'Packs', href: '/packs', active: false },
          { emoji: '🏆', label: 'Shelf', href: '/profile', active: false },
        ].map(tab => (
          <Link key={tab.label} href={tab.href} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            textDecoration: 'none',
            opacity: tab.active ? 1 : 0.45,
          }}>
            <span style={{ fontSize: '22px' }}>{tab.emoji}</span>
            <span style={{
              fontSize: '10.5px',
              fontWeight: 600,
              color: tab.active ? 'var(--acc)' : 'var(--ink)',
            }}>{tab.label}</span>
          </Link>
        ))}
      </div>

      {/* Logout */}
      <div style={{ position: 'fixed', bottom: '96px', left: '50%', transform: 'translateX(-50%)' }}>
        <button onClick={handleLogout} style={{
          background: 'none',
          border: 'none',
          fontSize: '11.5px',
          color: 'var(--ink-2)',
          cursor: 'pointer',
        }}>
          Log out
        </button>
      </div>
    </div>
  )
}
