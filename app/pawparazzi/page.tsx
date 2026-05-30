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
            <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Placeholder for icon - will be replaced with actual SVG from Claude Design */}
              {tab.icon === 'pawparazzi' && <span style={{ fontSize: '16px' }}>📸</span>}
            </div>
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
