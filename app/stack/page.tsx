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
      <div className="min-h-screen bg-app flex items-center justify-center">
        <p style={{ color: 'var(--ink-2)' }}>Loading pets...</p>
      </div>
    )
  }

  if (noMore || pets.length === 0) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-4xl mb-4">🥺</p>
          <h1 className="display-lg" style={{ color: 'var(--ink)', marginBottom: '16px' }}>That&apos;s everyone for today</h1>
          <p style={{ color: 'var(--ink-2)', marginBottom: '32px' }} className="max-w-sm">Come back later for more pets to discover. Or check out The Dex to see what you&apos;ve spotted.</p>
          <div className="flex gap-4 justify-center mb-8">
            <button onClick={() => { setCurrentIndex(0); setNoMore(false) }} className="px-6 py-2 rounded-lg text-white button-text hover:opacity-90" style={{ background: 'var(--acc)' }}>
              Start over
            </button>
            <Link href="/dex" className="px-6 py-2 rounded-lg text-white button-text hover:opacity-90" style={{ background: 'var(--ink)' }}>
              The Dex
            </Link>
          </div>
          <button onClick={handleLogout} className="text-sm hover:opacity-70" style={{ color: 'var(--ink-2)' }}>
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
    <div className="min-h-screen bg-app" style={{
      backgroundImage: `
        radial-gradient(circle at 20% 20%, rgba(217, 119, 87, 0.08), transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(90, 122, 154, 0.06), transparent 50%)
      `
    }}>
      {/* Header */}
      <div className="flex justify-between items-start p-6" style={{ paddingTop: 'var(--space-7)' }}>
        <div>
          <p className="kicker" style={{ color: 'var(--acc)' }}>SNOUT</p>
          <h1 className="display-lg" style={{ color: 'var(--ink)' }}>Stack</h1>
          <p className="text-xs" style={{ color: 'var(--ink-2)', marginTop: '4px' }}>One card at a time · {String(viewedToday).padStart(2, '0')} / {dailyTarget} today</p>
        </div>
        <button className="w-10 h-10 rounded-full hover:opacity-70" style={{ background: 'rgba(0, 0, 0, 0.06)', color: 'var(--ink)' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="7.5" cy="7.5" r="5.5" />
            <path d="M12 12l3.5 3.5" />
          </svg>
        </button>
      </div>

      {/* Card Stack Container */}
      <div className="relative mx-auto" style={{ maxWidth: '340px', height: '590px', margin: '0 26px' }}>
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
          <div className="flex-1 relative bg-gray-300 overflow-hidden">
            {currentPet.avatar_url ? (
              <img src={currentPet.avatar_url} alt={currentPet.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ color: '#ccc' }}>
                <span className="text-4xl">🐾</span>
              </div>
            )}

            {/* Corner Brackets */}
            {[
              { top: '14px', left: '14px', styles: 'border-t-2 border-l-2' },
              { top: '14px', right: '14px', styles: 'border-t-2 border-r-2' },
              { bottom: '14px', left: '14px', styles: 'border-b-2 border-l-2' },
              { bottom: '14px', right: '14px', styles: 'border-b-2 border-r-2' },
            ].map((bracket, i) => (
              <div
                key={i}
                className="absolute w-5 h-5"
                style={{
                  ...bracket,
                  borderColor: 'rgba(255, 255, 255, 0.7)',
                } as any}
              />
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
              <p className="button-text-small" style={{ color: '#fff', letterSpacing: '1.5px' }}>
                CARD · {String(viewedToday).padStart(2, '0')}/{String(dailyTarget).padStart(2, '0')}
              </p>
            </div>
          </div>

          {/* Meta Block */}
          <div style={{ padding: '16px 18px 14px' }}>
            {/* Name & Card Number */}
            <div className="flex justify-between items-baseline gap-2 mb-2">
              <h2 className="display-xl" style={{ color: 'var(--ink)' }}>@{owner?.username || currentPet.name}</h2>
              <p className="text-xs" style={{ color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>#{currentPet.card_number} · {currentPet.species}</p>
            </div>

            {/* Breed Chip */}
            {currentPet.breed && (
              <div style={{ marginTop: '8px' }}>
                <span className="chip-text" style={{
                  display: 'inline-block',
                  padding: '3px 9px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(217, 119, 87, 0.12)',
                  color: 'var(--acc)',
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
          className="absolute text-white flex flex-col items-center justify-center hover:opacity-90 active:scale-95"
          style={{
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
          }}
        >
          <span className="text-2xl">👉</span>
          <p className="button-text-small">BOOP</p>
        </button>
      </div>

      {/* Gesture Hints */}
      <div className="flex justify-between text-xs mt-4 px-7" style={{ color: 'var(--ink-2)' }}>
        <span>← their roll</span>
        <span className="font-semibold" style={{ color: 'var(--acc)' }}>↑ next pet</span>
        <span>stash →</span>
      </div>

      {/* Counters Strip */}
      <div className="flex gap-2 mt-4 px-6 mx-auto" style={{ maxWidth: '340px' }}>
        {[
          { label: 'BOOPS', value: counters.boops },
          { label: 'STASHED', value: counters.stashed },
          { label: 'PACKS', value: counters.packs },
          { label: 'CARDS', value: counters.cards },
        ].map(counter => (
          <div key={counter.label} className="flex-1 text-center py-2" style={{
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--paper)',
          }}>
            <p className="display-sm" style={{ color: 'var(--ink)' }}>{counter.value}</p>
            <p className="label" style={{ color: 'var(--ink-2)', marginTop: '3px' }}>{counter.label}</p>
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
          { emoji: '📚', label: 'Stack', href: '/stack', active: true },
          { emoji: '📖', label: 'Dex', href: '/dex', active: false },
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

      {/* Logout */}
      <div style={{ position: 'fixed', bottom: '96px', left: '50%', transform: 'translateX(-50%)' }}>
        <button onClick={handleLogout} className="text-sm" style={{ color: 'var(--ink-2)', cursor: 'pointer' }}>
          Log out
        </button>
      </div>
    </div>
  )
}
