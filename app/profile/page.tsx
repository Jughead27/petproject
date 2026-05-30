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
  const [isDarkNav, setIsDarkNav] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('nav-theme')
    if (saved) {
      setIsDarkNav(saved === 'dark')
    }
  }, [])

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

  const toggleNavTheme = () => {
    const newTheme = !isDarkNav
    setIsDarkNav(newTheme)
    localStorage.setItem('nav-theme', newTheme ? 'dark' : 'light')
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/profile/edit" style={{
            width: '40px',
            height: '40px',
            borderRadius: '0px',
            background: 'transparent',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'all 180ms ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)')}
          title="Edit profile"
          >
            ✎
          </Link>
          <button
            onClick={toggleNavTheme}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '0px',
              background: 'transparent',
              border: '1px solid var(--line)',
              color: 'var(--ink)',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 180ms ease',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)')}
            title={isDarkNav ? 'Light nav' : 'Dark nav'}
          >
            {isDarkNav ? '☀️' : '🌙'}
          </button>
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
      </div>

      {/* Content */}
      <div style={{ padding: '24px 20px' }}>
        {pets.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '40px', paddingBottom: '40px' }}>
            <p style={{ fontSize: '44px', marginBottom: '16px' }}>🐾</p>
            <h2 style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: '28px',
              fontWeight: 400,
              fontStyle: 'italic',
              color: 'var(--ink)',
              marginBottom: '10px',
              lineHeight: 1.1,
            }}>
              No pets yet
            </h2>
            <p style={{
              fontSize: '13px',
              color: 'var(--ink-2)',
              marginBottom: '28px',
            }}>
              Create your first pet card to get started
            </p>
            <Link href="/pets/create" style={{
              padding: '12px 28px',
              background: 'var(--acc)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.5px',
              borderRadius: '0px',
              boxShadow: '0 4px 12px rgba(217, 119, 87, 0.25)',
              transition: 'all 160ms ease',
              display: 'inline-block',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 8px 20px rgba(217, 119, 87, 0.35)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(217, 119, 87, 0.25)')}
            >
              Create First Pet
            </Link>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '14px',
              marginBottom: '28px',
            }}>
              {pets.map(pet => (
                <Link
                  key={pet.id}
                  href={`/pets/${pet.id}`}
                  style={{
                    background: 'var(--paper)',
                    border: '1px solid var(--line)',
                    borderRadius: '0px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    textDecoration: 'none',
                    transition: 'all 160ms ease',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.12)', e.currentTarget.style.transform = 'translateY(-3px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.06)', e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <div style={{
                    aspectRatio: '3/4',
                    backgroundColor: '#e5e1d7',
                    backgroundImage: pet.avatar_url ? `url(${pet.avatar_url})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
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
                      fontWeight: 600,
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
                padding: '12px 28px',
                background: 'transparent',
                color: 'var(--acc)',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                borderRadius: '0px',
                border: '1.5px solid var(--acc)',
                transition: 'all 160ms ease',
                display: 'inline-block',
                boxShadow: '0 2px 6px rgba(217, 119, 87, 0.1)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--acc)', e.currentTarget.style.color = '#fff', e.currentTarget.style.boxShadow = '0 4px 12px rgba(217, 119, 87, 0.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--acc)', e.currentTarget.style.boxShadow = '0 2px 6px rgba(217, 119, 87, 0.1)')}
              >
                + Add Another Pet
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
        background: isDarkNav ? 'rgba(30, 30, 30, 0.96)' : 'rgba(239, 236, 229, 0.96)',
        backdropFilter: 'blur(20px)',
        borderTop: isDarkNav ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid var(--line)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
      }}>
        {[
          { icon: 'explore', label: 'Explore', href: '/stack', active: false },
          { icon: 'pawparazzi', label: 'Pawparazzi', href: '/pawparazzi', active: false },
          { icon: 'create', label: 'Create', href: '/create', active: false },
          { icon: 'profile', label: 'Profile', href: '/profile', active: true },
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: tab.active ? 'var(--acc)' : (isDarkNav ? '#fff' : 'var(--ink)') }}>
              {tab.icon === 'explore' && (
                <>
                  <ellipse cx="12" cy="16.2" rx="5" ry="4.3"/>
                  <circle cx="5.4" cy="11.2" r="2.05"/>
                  <circle cx="9.5" cy="7.6" r="2.25"/>
                  <circle cx="14.5" cy="7.6" r="2.25"/>
                  <circle cx="18.6" cy="11.2" r="2.05"/>
                </>
              )}
              {tab.icon === 'pawparazzi' && (
                <>
                  <ellipse cx="4.0" cy="15.6" rx="2.5" ry="4.5"/>
                  <ellipse cx="5.2" cy="14.0" rx="1.8" ry="3.6"/>
                  <rect x="4.6" y="16" width="2.0" height="4.4"/>
                  <circle cx="5.2" cy="9.6" r="2.1"/>
                  <polygon points="3.8,5.9 5.0,7.8 3.5,7.9"/>
                  <polygon points="6.3,5.9 6.9,7.9 5.4,7.8"/>
                  <path d="M1.9,20 C0.6,18.4 0.9,14.6 2.6,14 C1.7,15.2 1.9,18 3.0,19.2 Z"/>
                  <ellipse cx="9.8" cy="16.3" rx="2.6" ry="3.5"/>
                  <ellipse cx="11.4" cy="14.4" rx="2.6" ry="3.0"/>
                  <rect x="12.2" y="12" width="1.9" height="8.5"/>
                  <ellipse cx="12.6" cy="11.6" rx="1.5" ry="2.1"/>
                  <circle cx="13.4" cy="9.5" r="2.0"/>
                  <ellipse cx="12.5" cy="9.7" rx="0.95" ry="1.7"/>
                  <polygon points="14.9,9.1 16.6,10.0 14.9,10.8"/>
                  <polygon points="7.9,15 6.8,12.6 8.4,13.9"/>
                  <ellipse cx="19.2" cy="14.8" rx="2.4" ry="3.1"/>
                  <circle cx="20.5" cy="11.0" r="1.6"/>
                  <polygon points="21.9,10.9 23.1,11.5 21.8,11.8"/>
                  <polygon points="17.0,16.6 16.7,18.7 18.6,17.2"/>
                  <rect x="18.6" y="17.4" width="0.55" height="2.9"/>
                  <rect x="19.8" y="17.4" width="0.55" height="2.9"/>
                </>
              )}
              {tab.icon === 'create' && (
                <>
                  <circle cx="5.4" cy="11.2" r="2.05"/>
                  <circle cx="9.5" cy="7.6" r="2.25"/>
                  <circle cx="14.5" cy="7.6" r="2.25"/>
                  <circle cx="18.6" cy="11.2" r="2.05"/>
                  <path fillRule="evenodd" d="M7,16.2 a5,4.3 0 1,0 10,0 a5,4.3 0 1,0 -10,0 Z M10.85,13.2 L13.15,13.2 L13.15,15.05 L15,15.05 L15,17.35 L13.15,17.35 L13.15,19.2 L10.85,19.2 L10.85,17.35 L9,17.35 L9,15.05 L10.85,15.05 Z"/>
                </>
              )}
              {tab.icon === 'profile' && (
                <>
                  <path fillRule="evenodd" d="M4.6,3.4 L8.8,6.6 L15.2,6.6 L19.4,3.4 Q18.8,7 18,9.2 Q17,13.5 12,18.8 Q7,13.5 6,9.2 Q5.2,7 4.6,3.4 Z M8.85,11.2 a1.15,1.15 0 1,0 2.3,0 a1.15,1.15 0 1,0 -2.3,0 Z M12.85,11.2 a1.15,1.15 0 1,0 2.3,0 a1.15,1.15 0 1,0 -2.3,0 Z"/>
                </>
              )}
            </svg>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              color: tab.active ? 'var(--acc)' : (isDarkNav ? '#fff' : 'var(--ink)'),
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
