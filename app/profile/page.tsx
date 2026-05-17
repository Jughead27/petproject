'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Pet {
  id: string
  name: string
  species: string
  avatar_url: string | null
}

interface UserProfile {
  username: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          router.push('/login')
          return
        }
        setUser(userData.user as { id: string })

        const { data: profileData } = await supabase
          .from('users')
          .select('username')
          .eq('id', userData.user.id)
          .single()
        setProfile(profileData)

        const { data: petsData } = await supabase
          .from('pets')
          .select('id, name, species, avatar_url')
          .eq('owner_id', userData.user.id)
          .order('created_at', { ascending: false })
        setPets(petsData || [])
        setLoading(false)
      } catch (err) {
        console.error('Profile load error:', err)
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

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
        borderBottom: '1px solid var(--line)',
      }}>
        <div>
          <p style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            color: 'var(--acc)',
            margin: '0 0 8px 0',
          }}>
            Shelf
          </p>
          <h1 style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: '32px',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--ink)',
            margin: '0 0 6px 0',
            lineHeight: 1,
          }}>
            Your Pets
          </h1>
          <p style={{
            fontSize: '12px',
            color: 'var(--ink-2)',
            margin: 0,
          }}>
            @{profile?.username} · {pets.length} pet{pets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '0px',
            background: 'transparent',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            cursor: 'pointer',
            fontSize: '18px',
            transition: 'all 180ms ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)')}
          title="Logout"
        >
          ↪
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '32px 24px' }}>
        {pets.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '48px', paddingBottom: '48px' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🐾</p>
            <h2 style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: '24px',
              fontWeight: 400,
              fontStyle: 'italic',
              color: 'var(--ink)',
              marginBottom: '12px',
              lineHeight: 1,
            }}>
              No pets yet
            </h2>
            <p style={{
              fontSize: '13px',
              color: 'var(--ink-2)',
              marginBottom: '24px',
            }}>
              Create your first pet to get started
            </p>
            <Link href="/pets/create" style={{
              padding: '16px 32px',
              background: 'var(--acc)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              borderRadius: '0px',
              boxShadow: '0 8px 24px rgba(217, 119, 87, 0.3)',
              transition: 'all 180ms ease',
              display: 'inline-block',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 12px 32px rgba(217, 119, 87, 0.4)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 8px 24px rgba(217, 119, 87, 0.3)')}
            >
              Create Pet
            </Link>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '16px',
              marginBottom: '32px',
            }}>
              {pets.map(pet => (
                <Link
                  key={pet.id}
                  href={`/pets/${pet.id}`}
                  style={{
                    background: 'var(--paper)',
                    border: '2px solid var(--line)',
                    borderRadius: '0px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    textDecoration: 'none',
                    transition: 'all 180ms ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)', e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)', e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <div style={{
                    aspectRatio: '3/4',
                    backgroundColor: '#ddd',
                    backgroundImage: pet.avatar_url ? `url(${pet.avatar_url})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                  }}>
                    {!pet.avatar_url && '🐾'}
                  </div>
                  <div style={{ padding: '12px' }}>
                    <h3 style={{
                      fontFamily: '"Instrument Serif", Georgia, serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      fontStyle: 'italic',
                      color: 'var(--ink)',
                      margin: '0 0 4px 0',
                      lineHeight: 1,
                    }}>
                      {pet.name}
                    </h3>
                    <p style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--ink-2)',
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      {pet.species}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <Link href="/pets/create" style={{
                padding: '16px 32px',
                background: 'transparent',
                color: 'var(--acc)',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                borderRadius: '0px',
                border: '2px solid var(--acc)',
                transition: 'all 180ms ease',
                display: 'inline-block',
                boxShadow: '0 2px 8px rgba(217, 119, 87, 0.15)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--acc)', e.currentTarget.style.color = '#fff', e.currentTarget.style.boxShadow = '0 8px 24px rgba(217, 119, 87, 0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--acc)', e.currentTarget.style.boxShadow = '0 2px 8px rgba(217, 119, 87, 0.15)')}
              >
                + Add Pet
              </Link>
            </div>
          </>
        )}
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
        background: 'rgba(239, 236, 229, 0.96)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--line)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
      }}>
        {[
          { emoji: '📚', label: 'Stack', href: '/stack', active: false },
          { emoji: '🏆', label: 'Shelf', href: '/profile', active: true },
        ].map(tab => (
          <Link key={tab.label} href={tab.href} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            textDecoration: 'none',
            opacity: tab.active ? 1 : 0.5,
            transition: 'opacity 180ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = tab.active ? '1' : '0.5')}
          >
            <span style={{ fontSize: '22px' }}>{tab.emoji}</span>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              color: tab.active ? 'var(--acc)' : 'var(--ink)',
              letterSpacing: '0.5px',
            }}>
              {tab.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
