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

export default function PawparazziPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [followedPets, setFollowedPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [isDarkNav, setIsDarkNav] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('nav-theme')
    if (saved) {
      setIsDarkNav(saved === 'dark')
    }
  }, [])

  useEffect(() => {
    const loadFollowedPets = async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          router.push('/login')
          return
        }
        setUser(userData.user as { id: string })

        // Get all pets from owners this user follows
        const { data: followsData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userData.user.id)

        if (followsData && followsData.length > 0) {
          const followingIds = followsData.map(f => f.following_id)

          const { data: petsData } = await supabase
            .from('pets')
            .select('id, name, species, avatar_url')
            .in('owner_id', followingIds)
            .order('created_at', { ascending: false })

          setFollowedPets(petsData || [])
        }
        setLoading(false)
      } catch (err) {
        console.error('Pawparazzi load error:', err)
        setLoading(false)
      }
    }

    loadFollowedPets()
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
        <p style={{ color: 'var(--ink-2)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--app-bg)',
      paddingBottom: '100px',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--paper)',
      }}>
        <h1 style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: '28px',
          fontWeight: 400,
          fontStyle: 'italic',
          color: 'var(--ink)',
          margin: 0,
        }}>
          Pawparazzi
        </h1>
        <p style={{
          fontSize: '12px',
          color: 'var(--ink-2)',
          margin: '6px 0 0 0',
        }}>
          Pets you're following
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {followedPets.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '40px' }}>
            <p style={{ fontSize: '40px', marginBottom: '12px' }}>🐾</p>
            <h2 style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: '20px',
              fontWeight: 400,
              fontStyle: 'italic',
              color: 'var(--ink)',
              marginBottom: '8px',
            }}>
              No pets yet
            </h2>
            <p style={{
              fontSize: '12px',
              color: 'var(--ink-2)',
              marginBottom: '20px',
            }}>
              Follow pets from the Explore feed to see them here
            </p>
            <Link href="/stack" style={{
              padding: '10px 20px',
              background: 'var(--acc)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '0px',
              display: 'inline-block',
            }}>
              Explore Pets
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '16px',
          }}>
            {followedPets.map(pet => (
              <Link
                key={pet.id}
                href={`/pets/${pet.id}`}
                style={{
                  textDecoration: 'none',
                  borderRadius: '0px',
                  overflow: 'hidden',
                  transition: 'transform 160ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <div style={{
                  aspectRatio: '1',
                  backgroundColor: '#e5e1d7',
                  backgroundImage: pet.avatar_url ? `url(${pet.avatar_url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid var(--line)',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {!pet.avatar_url && <span style={{ fontSize: '32px' }}>🐾</span>}
                </div>
                <h3 style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  margin: '0 0 2px 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {pet.name}
                </h3>
                <p style={{
                  fontSize: '10px',
                  color: 'var(--ink-2)',
                  margin: 0,
                }}>
                  {pet.species}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '76px',
        paddingTop: '8px',
        paddingBottom: '12px',
        background: isDarkNav ? 'rgba(30, 30, 30, 0.92)' : 'rgba(250, 250, 247, 0.92)',
        backdropFilter: 'blur(16px)',
        borderTop: isDarkNav ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid var(--line)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
      }}>
        {[
          { icon: 'explore', label: 'Explore', href: '/stack', active: false },
          { icon: 'pawparazzi', label: 'Pawparazzi', href: '/pawparazzi', active: true },
          { icon: 'create', label: 'Create', href: '/create', active: false },
          { icon: 'profile', label: 'Profile', href: '/profile', active: false },
        ].map(tab => (
          <Link
            key={tab.label}
            href={tab.href}
            style={{
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
              fontSize: '9px',
              fontWeight: 600,
              color: tab.active ? 'var(--acc)' : (isDarkNav ? '#fff' : 'var(--ink)'),
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
