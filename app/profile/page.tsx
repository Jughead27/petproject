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
  card_number: number | null
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
          .select('id, name, species, avatar_url, card_number')
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
        <p style={{ color: 'var(--ink-2)' }}>Loading profile...</p>
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
          <h1 className="display-lg" style={{ color: 'var(--ink)' }}>Your Shelf</h1>
          <p className="text-xs" style={{ color: 'var(--ink-2)', marginTop: '4px' }}>
            @{profile?.username || 'user'} · {pets.length} pet{pets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.06)',
            color: 'var(--ink)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M6 3h-2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2" />
            <path d="M13 12l3-3m0 0l-3-3" />
          </svg>
        </button>
      </div>

      {/* Pet Grid */}
      <div style={{ paddingLeft: '24px', paddingRight: '24px' }}>
        {pets.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '48px', paddingBottom: '48px' }}>
            <p style={{ fontSize: '32px', marginBottom: '16px' }}>🐾</p>
            <p style={{ fontSize: '11.5px', color: 'var(--ink-2)', marginBottom: '16px' }}>You haven't added any pets yet</p>
            <Link
              href="/pets/create"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                borderRadius: '12px',
                background: 'var(--acc)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
              }}
            >
              Add your first pet
            </Link>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '12px',
              marginBottom: '16px',
            }}>
              {pets.map(pet => (
                <Link
                  key={pet.id}
                  href={`/pets/${pet.id}`}
                  style={{
                    background: 'var(--paper)',
                    border: '1px solid var(--line)',
                    boxShadow: 'var(--shadow-sm)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'block',
                    textDecoration: 'none',
                    transition: 'opacity 200ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  <div style={{
                    aspectRatio: '3/4',
                    backgroundColor: '#ddd',
                    backgroundImage: pet.avatar_url ? `url(${pet.avatar_url})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {!pet.avatar_url && <span style={{ fontSize: '32px' }}>🐾</span>}
                    {pet.card_number && (
                      <div style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        color: '#fff',
                        fontSize: '8px',
                        fontWeight: 600,
                      }}>
                        #{String(pet.card_number).padStart(3, '0')}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '10px' }}>
                    <h3 className="display-sm" style={{ color: 'var(--ink)', marginBottom: '4px' }}>
                      {pet.name}
                    </h3>
                    <p className="label" style={{ color: 'var(--ink-2)' }}>
                      {pet.species}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <Link
                href="/pets/create"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  background: 'var(--acc)',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '12.5px',
                  fontWeight: 600,
                }}
              >
                Add another pet
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
          { emoji: '🐾', label: 'Packs', href: '/packs', active: false },
          { emoji: '🏆', label: 'Shelf', href: '/profile', active: true },
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
