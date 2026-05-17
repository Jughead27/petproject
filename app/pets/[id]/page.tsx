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

interface UserProfile {
  username: string | null
}

export default function ShelfPage() {
  const router = useRouter()
  const params = useParams()
  const petId = params.id as string
  const [pet, setPet] = useState<Pet | null>(null)
  const [owner, setOwner] = useState<UserProfile | null>(null)
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

          const { data: ownerData } = await supabase
            .from('users')
            .select('username')
            .eq('id', petData.owner_id)
            .single()
          setOwner(ownerData)
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
      <div className="min-h-screen bg-app flex items-center justify-center">
        <p style={{ color: 'var(--ink-2)' }}>Loading pet card...</p>
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-4xl mb-4">🐾</p>
          <h1 className="display-lg" style={{ color: 'var(--ink)', marginBottom: '16px' }}>Pet not found</h1>
          <Link href="/stack" className="text-sm" style={{ color: 'var(--acc)' }}>
            Back to Stack
          </Link>
        </div>
      </div>
    )
  }

  const ageDisplay = pet.age_years !== null
    ? `${pet.age_years}y ${pet.age_months || 0}m`
    : '—'

  return (
    <div className="min-h-screen bg-app pb-20">
      {/* Hero Section */}
      <div style={{
        height: '260px',
        backgroundColor: '#ddd',
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
          background: 'linear-gradient(to bottom, transparent 40%, rgba(250, 250, 247, 0.8) 85%, rgba(250, 250, 247, 1))',
          pointerEvents: 'none',
        }} />

        {/* Header Controls */}
        <div style={{
          position: 'absolute',
          top: '18px',
          left: '18px',
          right: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
        }}>
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full hover:opacity-70"
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              color: '#fff',
              border: '0.5px solid rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(12px)',
              fontSize: '18px',
            }}
          >
            ←
          </button>

          {pet.card_number && (
            <div style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(10px)',
            }}>
              <p className="button-text-small" style={{ color: '#fff', letterSpacing: '1px' }}>
                CARD #{String(pet.card_number).padStart(3, '0')}
              </p>
            </div>
          )}

          {isOwner && (
            <Link
              href={`/pets/${petId}/edit`}
              className="w-10 h-10 rounded-full hover:opacity-70 flex items-center justify-center"
              style={{
                background: 'rgba(255, 255, 255, 0.18)',
                color: '#fff',
                border: '0.5px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(12px)',
                fontSize: '16px',
              }}
            >
              ✎
            </Link>
          )}
        </div>

        {/* Avatar Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          left: '18px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          border: '4px solid var(--paper)',
          backgroundColor: '#ddd',
          backgroundImage: pet.avatar_url ? `url(${pet.avatar_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
          boxShadow: 'var(--shadow-card)',
        }}>
          {!pet.avatar_url && <span style={{ fontSize: '44px' }}>🐾</span>}
        </div>
      </div>

      {/* Content Panel */}
      <div style={{
        marginTop: '-40px',
        paddingTop: '60px',
        paddingLeft: '18px',
        paddingRight: '18px',
        paddingBottom: '18px',
        borderTopLeftRadius: 'var(--radius-lg)',
        borderTopRightRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--paper)',
        position: 'relative',
        zIndex: 4,
      }}>
        {/* Identity Block */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '6px' }}>
            <h1 className="display-xl" style={{ color: 'var(--ink)' }}>{pet.name}</h1>
            <p className="label" style={{ color: 'var(--ink-2)' }}>
              {pet.species}{pet.breed ? ` · ${pet.breed}` : ''}
            </p>
          </div>
          <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
            {ageDisplay}{pet.age_years !== null && ' old'}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <button className="py-3 rounded-lg button-text hover:opacity-90 transition-opacity" style={{
            background: 'var(--ink)',
            color: 'var(--paper)',
          }}>
            Follow
          </button>
          <button className="py-3 rounded-lg button-text hover:opacity-90 transition-opacity" style={{
            background: 'var(--acc)',
            color: '#fff',
          }}>
            Send treat
          </button>
        </div>

        {/* Bio Quote Block */}
        {pet.bio && (
          <div style={{
            padding: '12px 14px',
            borderLeft: '3px solid var(--acc)',
            backgroundColor: 'rgba(217, 119, 87, 0.08)',
            borderRadius: '4px',
            marginBottom: '20px',
          }}>
            <p className="text-sm" style={{ color: 'var(--ink)', fontStyle: 'italic', lineHeight: 1.5 }}>
              "{pet.bio}"
            </p>
          </div>
        )}

        {/* Trophy Case */}
        <div style={{ marginBottom: '24px' }}>
          <p className="label" style={{ color: 'var(--ink-2)', marginBottom: '12px' }}>TROPHY CASE</p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
          }}>
            {[...Array(10)].map((_, i) => {
              const unlocked = i < 3
              return (
                <div
                  key={i}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--line)',
                    backgroundColor: unlocked ? 'var(--paper)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}
                >
                  {unlocked ? ['🏅', '🎖️', '⭐'][i] : '?'}
                </div>
              )
            })}
          </div>
        </div>

        {/* Snapshot Wall */}
        <div style={{ marginBottom: '24px' }}>
          <p className="label" style={{ color: 'var(--ink-2)', marginBottom: '12px' }}>SNAPSHOT WALL</p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
          }}>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: '1',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#ddd',
                  border: '1px solid var(--line)',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={`https://picsum.photos/120/120?random=${i}`}
                  alt={`photo ${i}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Owner Info */}
        <div style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--app-bg)',
          textAlign: 'center',
        }}>
          <p className="text-xs" style={{ color: 'var(--ink-2)', marginBottom: '4px' }}>OWNER</p>
          <p className="display-sm" style={{ color: 'var(--ink)' }}>@{owner?.username || 'unknown'}</p>
        </div>
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
          <Link key={tab.label} href={tab.href} className="flex flex-col items-center gap-0.5" style={{ opacity: tab.active ? 1 : 0.45 }}>
            <span style={{ fontSize: '22px' }}>{tab.emoji}</span>
            <span className="text-xs font-medium" style={{ color: tab.active ? 'var(--acc)' : 'var(--ink)' }}>{tab.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
