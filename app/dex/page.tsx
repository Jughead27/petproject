'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const SPECIES_LIST = ['Dogs', 'Cats', 'Small', 'Birds', 'Reptiles', 'Fish']

interface BreedCard {
  id: string
  name: string
  number: number
  species: string
  photoUrl: string | null
  spotted: boolean
  petCount: number
}

export default function DexPage() {
  const router = useRouter()
  const [activeSpecies, setActiveSpecies] = useState('Dogs')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string } | null>(null)

  useEffect(() => {
    const loadDex = async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          router.push('/login')
          return
        }
        setUser(userData.user as { id: string })
        setLoading(false)
      } catch (err) {
        console.error('Dex load error:', err)
        setLoading(false)
      }
    }
    loadDex()
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
        <p style={{ color: 'var(--ink-2)', fontSize: '13.5px' }}>Loading breeds...</p>
      </div>
    )
  }

  const totalBreeds = 334
  const spottedCount = 47

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--app-bg)',
      backgroundImage: `
        radial-gradient(circle at 20% 20%, rgba(217, 119, 87, 0.08), transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(90, 122, 154, 0.06), transparent 50%)
      `,
      paddingBottom: '160px',
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
          }}>The Dex</h1>
          <p style={{
            fontSize: '10.5px',
            fontWeight: 400,
            lineHeight: 1,
            color: 'var(--ink-2)',
            marginTop: '4px',
          }}>
            {totalBreeds} breeds · you&apos;ve spotted {spottedCount}
          </p>
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

      {/* Species Filter Chips */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingLeft: '24px',
        paddingRight: '24px',
        paddingBottom: '8px',
        scrollBehavior: 'smooth',
      }}>
        {SPECIES_LIST.map(species => (
          <button
            key={species}
            onClick={() => setActiveSpecies(species)}
            style={{
              padding: '8px 16px',
              borderRadius: '999px',
              whiteSpace: 'nowrap',
              fontSize: '13.5px',
              fontWeight: 500,
              background: activeSpecies === species ? 'var(--ink)' : 'transparent',
              color: activeSpecies === species ? 'var(--paper)' : 'var(--ink)',
              border: `1px solid ${activeSpecies === species ? 'var(--ink)' : 'var(--line)'}`,
              cursor: 'pointer',
            }}
          >
            {species}
          </button>
        ))}
      </div>

      {/* Completion Bar */}
      <div style={{ paddingLeft: '24px', paddingRight: '24px', marginTop: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
        }}>
          <p style={{
            fontSize: '10.5px',
            fontWeight: 600,
            letterSpacing: '0.6px',
            lineHeight: 1,
            color: 'var(--ink-2)',
            margin: 0,
          }}>{activeSpecies}</p>
          <p style={{
            fontSize: '10.5px',
            fontWeight: 600,
            letterSpacing: '0.6px',
            lineHeight: 1,
            color: 'var(--ink-2)',
            margin: 0,
          }}>23 / 197 spotted</p>
        </div>
        <div style={{
          height: '3px',
          background: 'var(--line)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: '23%',
            background: 'var(--acc)',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Breed Grid */}
      <div style={{
        paddingLeft: '24px',
        paddingRight: '24px',
        marginTop: '24px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}>
          {[...Array(6)].map((_, i) => {
            const spotted = i < 3
            return (
              <div
                key={i}
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid var(--line)',
                  background: 'var(--paper)',
                  boxShadow: 'var(--shadow-sm)',
                  opacity: spotted ? 1 : 0.55,
                  cursor: 'pointer',
                }}
              >
                {/* Photo/Placeholder */}
                <div style={{
                  aspectRatio: '5/4',
                  background: spotted ? '#ddd' : 'repeating-linear-gradient(45deg, rgba(0,0,0,0.05) 0 8px, transparent 8px 9px)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {spotted ? (
                    <img
                      src={`https://picsum.photos/200/160?random=${i}`}
                      alt="breed"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <p style={{ fontSize: '32px', color: 'var(--ink-2)', opacity: 0.6, margin: 0 }}>?</p>
                  )}
                  {/* Number Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '6px',
                    left: '6px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    textShadow: '0 1px 2px #000',
                  }}>
                    #{String(12 + i).padStart(3, '0')}
                  </div>
                </div>

                {/* Meta */}
                <div style={{ padding: '8px 10px' }}>
                  <h3 style={{
                    fontFamily: '"Instrument Serif", Georgia, serif',
                    fontSize: '18px',
                    fontWeight: 400,
                    fontStyle: 'italic',
                    lineHeight: 1,
                    color: 'var(--ink)',
                    marginBottom: '6px',
                    margin: '0 0 6px 0',
                  }}>
                    {spotted ? ['Corgi', 'Husky', 'Golden Retriever'][i] : '???'}
                  </h3>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                  }}>
                    <p style={{
                      fontSize: '10.5px',
                      fontWeight: 600,
                      letterSpacing: '0.6px',
                      lineHeight: 1,
                      color: spotted ? 'var(--acc)' : 'var(--ink-2)',
                      margin: 0,
                    }}>
                      {spotted ? '✓ SPOTTED' : '— WILD'}
                    </p>
                    {spotted && <p style={{
                      fontSize: '10.5px',
                      fontWeight: 400,
                      lineHeight: 1,
                      color: 'var(--ink-2)',
                      margin: 0,
                    }}>234 pets</p>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
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
          { emoji: '📚', label: 'Stack', href: '/stack', active: false },
          { emoji: '📖', label: 'Dex', href: '/dex', active: true },
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
    </div>
  )
}
