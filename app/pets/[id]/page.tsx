'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Pet {
  id: string
  name: string
  species: string
  breed: string | null
  avatar_url: string | null
  cover_photo_url: string | null
  age_years: number | null
  age_months: number | null
  bio: string | null
  card_number: number | null
  owner_id: string
}

export default function PetCardPage() {
  const router = useRouter()
  const params = useParams()
  const petId = params.id as string
  const [pet, setPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const loadPet = async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          router.push('/login')
          return
        }
        setUser(userData.user as { id: string })

        const { data: petData } = await supabase
          .from('pets')
          .select('*')
          .eq('id', petId)
          .single()

        if (petData) {
          setPet(petData)
          setIsOwner(petData.owner_id === userData.user.id)
        }
        setLoading(false)
      } catch (err) {
        console.error('Pet load error:', err)
        setLoading(false)
      }
    }

    loadPet()
  }, [petId, router])

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

  if (!pet) {
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
          <p style={{ fontSize: '32px', marginBottom: '16px' }}>🐾</p>
          <h1 style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: '28px',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--ink)',
            marginBottom: '16px',
            lineHeight: 1,
          }}>
            Pet not found
          </h1>
          <Link href="/stack" style={{ color: 'var(--acc)', fontSize: '12px', fontWeight: 500 }}>
            ← Back to Stack
          </Link>
        </div>
      </div>
    )
  }

  const ageDisplay = pet.age_years !== null
    ? `${pet.age_years}y ${pet.age_months || 0}m`
    : null

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--app-bg)',
      paddingBottom: '100px',
    }}>
      {/* Hero Section */}
      <div style={{
        height: '240px',
        backgroundColor: '#e5e1d7',
        backgroundImage: pet.cover_photo_url ? `url(${pet.cover_photo_url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, transparent 30%, rgba(250, 250, 247, 0.7) 80%, rgba(250, 250, 247, 1))',
          pointerEvents: 'none',
        }} />

        {/* Header Controls */}
        <div style={{
          position: 'absolute',
          top: '14px',
          left: '16px',
          right: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
        }}>
          <button
            onClick={() => router.back()}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '0px',
              background: 'rgba(0, 0, 0, 0.3)',
              color: '#fff',
              border: 'none',
              backdropFilter: 'blur(10px)',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 160ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)')}
          >
            ←
          </button>

          {pet.card_number && (
            <div style={{
              padding: '6px 12px',
              borderRadius: '0px',
              background: 'rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(8px)',
            }}>
              <p style={{ color: '#fff', letterSpacing: '1px', fontSize: '9px', fontWeight: 700, margin: 0 }}>
                #{String(pet.card_number).padStart(3, '0')}
              </p>
            </div>
          )}

          {isOwner && (
            <Link
              href={`/pets/${petId}/edit`}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '0px',
                background: 'var(--acc)',
                color: '#fff',
                border: 'none',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 160ms ease',
                boxShadow: '0 4px 10px rgba(8, 145, 178, 0.2)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 6px 14px rgba(8, 145, 178, 0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 10px rgba(8, 145, 178, 0.2)')}
            >
              ✎
            </Link>
          )}
        </div>

        {/* Avatar Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '-44px',
          left: '16px',
          width: '88px',
          height: '88px',
          borderRadius: '0px',
          border: '3px solid var(--paper)',
          backgroundColor: '#e5e1d7',
          backgroundImage: pet.avatar_url ? `url(${pet.avatar_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
        }}>
          {!pet.avatar_url && <span style={{ fontSize: '40px' }}>🐾</span>}
        </div>
      </div>

      {/* Content Panel */}
      <div style={{
        marginTop: '-44px',
        paddingTop: '52px',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingBottom: '24px',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        backgroundColor: 'var(--paper)',
        position: 'relative',
        zIndex: 4,
      }}>
        {/* Pet Info */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: '36px',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--ink)',
            lineHeight: 1,
            margin: '0 0 6px 0',
          }}>
            {pet.name}
          </h1>
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            color: 'var(--ink-2)',
            lineHeight: 1,
            margin: 0,
            textTransform: 'uppercase',
          }}>
            {pet.species}{pet.breed ? ` · ${pet.breed}` : ''}
          </p>
          {ageDisplay && (
            <p style={{
              fontSize: '12px',
              fontWeight: 400,
              color: 'var(--ink-2)',
              lineHeight: 1.4,
              margin: '4px 0 0 0',
            }}>
              {ageDisplay} old
            </p>
          )}
        </div>

        {/* Bio */}
        {pet.bio && (
          <div style={{
            padding: '12px 14px',
            borderLeft: '3px solid var(--acc)',
            backgroundColor: 'rgba(217, 119, 87, 0.06)',
            borderRadius: '0px',
            marginBottom: '20px',
          }}>
            <p style={{
              fontSize: '12px',
              fontWeight: 400,
              color: 'var(--ink)',
              fontStyle: 'italic',
              lineHeight: 1.6,
              margin: 0,
            }}>
              "{pet.bio}"
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
          <button style={{
            padding: '12px 16px',
            borderRadius: '0px',
            background: 'var(--ink)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.4px',
            transition: 'all 160ms ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)')}
          >
            Follow
          </button>
          <button style={{
            padding: '12px 16px',
            borderRadius: '0px',
            background: 'var(--acc)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.4px',
            transition: 'all 160ms ease',
            boxShadow: '0 4px 12px rgba(217, 119, 87, 0.2)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 6px 16px rgba(217, 119, 87, 0.3)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(217, 119, 87, 0.2)')}
          >
            Send treat
          </button>
        </div>

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
          { icon: 'explore', label: 'Explore', href: '/stack', active: false },
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" style={{ color: tab.active ? 'var(--acc)' : 'var(--ink)' }}>
              {tab.icon === 'explore' && (
                <>
                  <circle cx="7" cy="8" r="1.5" fill="currentColor" />
                  <circle cx="7" cy="14" r="1" fill="currentColor" />
                  <circle cx="7" cy="20" r="1" fill="currentColor" />
                  <circle cx="14" cy="10" r="1.5" fill="currentColor" />
                  <circle cx="14" cy="16" r="1" fill="currentColor" />
                  <circle cx="18" cy="6" r="1" fill="currentColor" />
                  <circle cx="18" cy="12" r="1.5" fill="currentColor" />
                </>
              )}
              {tab.icon === 'create' && (
                <>
                  <circle cx="10" cy="12" r="3" />
                  <circle cx="6" cy="9" r="1.5" fill="currentColor" />
                  <circle cx="6" cy="15" r="1.5" fill="currentColor" />
                  <circle cx="14" cy="9" r="1.5" fill="currentColor" />
                  <circle cx="14" cy="15" r="1.5" fill="currentColor" />
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="4" y1="12" x2="16" y2="12" />
                </>
              )}
              {tab.icon === 'profile' && (
                <>
                  <circle cx="8" cy="7" r="1.5" fill="currentColor" />
                  <circle cx="16" cy="7" r="1.5" fill="currentColor" />
                  <path d="M7 10c0 0-2 2-2 4s1 4 5 4s5-2 5-4s-2-4-2-4" />
                  <path d="M10 14l-0.5 2M14 14l0.5 2" />
                </>
              )}
            </svg>
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
