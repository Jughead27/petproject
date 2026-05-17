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
  const [breeds, setBreeds] = useState<BreedCard[]>([])
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
      <div className="min-h-screen bg-app flex items-center justify-center">
        <p style={{ color: 'var(--ink-2)' }}>Loading breeds...</p>
      </div>
    )
  }

  const totalBreeds = 334
  const spottedCount = 47

  return (
    <div className="min-h-screen bg-app pb-20" style={{
      backgroundImage: `
        radial-gradient(circle at 20% 20%, rgba(217, 119, 87, 0.08), transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(90, 122, 154, 0.06), transparent 50%)
      `
    }}>
      {/* Header */}
      <div className="flex justify-between items-start p-6" style={{ paddingTop: 'var(--space-8)' }}>
        <div>
          <p className="kicker" style={{ color: 'var(--acc)' }}>SNOUT</p>
          <h1 className="display-lg" style={{ color: 'var(--ink)' }}>The Dex</h1>
          <p className="text-xs" style={{ color: 'var(--ink-2)', marginTop: '4px' }}>
            {totalBreeds} breeds · you&apos;ve spotted {spottedCount}
          </p>
        </div>
        <button className="w-10 h-10 rounded-full hover:opacity-70" style={{ background: 'rgba(0, 0, 0, 0.06)', color: 'var(--ink)' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="7.5" cy="7.5" r="5.5" />
            <path d="M12 12l3.5 3.5" />
          </svg>
        </button>
      </div>

      {/* Species Filter Chips */}
      <div className="flex gap-2 overflow-x-auto px-6 pb-2" style={{ scrollBehavior: 'smooth' }}>
        {SPECIES_LIST.map(species => (
          <button
            key={species}
            onClick={() => setActiveSpecies(species)}
            className="px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-medium transition-colors"
            style={{
              background: activeSpecies === species ? 'var(--ink)' : 'transparent',
              color: activeSpecies === species ? 'var(--paper)' : 'var(--ink)',
              border: `1px solid ${activeSpecies === species ? 'var(--ink)' : 'var(--line)'}`,
            }}
          >
            {species}
          </button>
        ))}
      </div>

      {/* Completion Bar */}
      <div className="px-6 mt-4">
        <div className="flex justify-between items-center mb-1">
          <p className="label" style={{ color: 'var(--ink-2)' }}>{activeSpecies}</p>
          <p className="label" style={{ color: 'var(--ink-2)' }}>23 / 197 spotted</p>
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
      <div className="px-6 mt-6">
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
                className="rounded-lg overflow-hidden border hover:opacity-75 transition-opacity"
                style={{
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  boxShadow: 'var(--shadow-sm)',
                  opacity: spotted ? 1 : 0.55,
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
                    <p style={{ fontSize: '32px', color: 'var(--ink-2)', opacity: 0.6 }}>?</p>
                  )}
                  {/* Number Badge */}
                  <div
                    style={{
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
                    }}
                  >
                    #{String(12 + i).padStart(3, '0')}
                  </div>
                </div>

                {/* Meta */}
                <div style={{ padding: '8px 10px' }}>
                  <h3 className="display-sm" style={{ color: 'var(--ink)', marginBottom: '6px' }}>
                    {spotted ? ['Corgi', 'Husky', 'Golden Retriever'][i] : '???'}
                  </h3>
                  <div className="flex justify-between items-end">
                    <p className="label" style={{ color: spotted ? 'var(--acc)' : 'var(--ink-2)' }}>
                      {spotted ? '✓ SPOTTED' : '— WILD'}
                    </p>
                    {spotted && <p className="text-xs" style={{ color: 'var(--ink-2)' }}>234 pets</p>}
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
          { emoji: '📖', label: 'Dex', href: '/dex', active: true },
          { emoji: '📸', label: 'Burst', href: '/burst', active: false },
          { emoji: '🐾', label: 'Packs', href: '/packs', active: false },
          { emoji: '🏆', label: 'Shelf', href: '/profile', active: false },
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
