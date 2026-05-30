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
  cover_url: string | null
  bio: string | null
  owner_id: string
}

export default function StackPage() {
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [loadingFollow, setLoadingFollow] = useState(false)

  // Check onboarding status immediately
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) return

        const { count } = await supabase
          .from('pets')
          .select('id', { count: 'exact', head: true })
          .eq('owner_id', userData.user.id)

        console.log('[Stack] Onboarding check - user pets count:', count)
        if (!count || count === 0) {
          console.log('[Stack] No pets found, redirecting to /onboarding')
          router.push('/onboarding')
        } else {
          console.log('[Stack] User has pets, allowing stack access')
        }
      } catch (err) {
        console.error('Onboarding check error:', err)
      }
    }

    checkOnboarding()
  }, [router])

  // Load pets
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
          .order('created_at', { ascending: false })

        setPets(allPets || [])
        setLoading(false)
      } catch (err) {
        console.error('Stack load error:', err)
        setLoading(false)
      }
    }

    loadStack()
  }, [router])

  // Load follow state and follower count
  useEffect(() => {
    const loadFollowState = async () => {
      if (currentIndex < pets.length && user) {
        const currentPet = pets[currentIndex]
        try {
          const supabase = createClient()

          // Get follower count
          const { count } = await supabase
            .from('follows')
            .select('*', { count: 'exact' })
            .eq('following_id', currentPet.owner_id)
          setFollowerCount(count || 0)

          // Check if user follows this pet owner
          const { data: followData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', user.id)
            .eq('following_id', currentPet.owner_id)
            .single()

          setIsFollowing(!!followData)
        } catch (err) {
          console.error('Follow fetch error:', err)
        }
      }
    }

    loadFollowState()
  }, [currentIndex, pets, user])

  const handleFollow = async () => {
    if (!user || currentIndex >= pets.length) return

    const currentPet = pets[currentIndex]
    setLoadingFollow(true)

    try {
      const supabase = createClient()

      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', currentPet.owner_id)
        setIsFollowing(false)
        setFollowerCount(prev => Math.max(0, prev - 1))
      } else {
        // Follow
        await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: currentPet.owner_id,
        })
        setIsFollowing(true)
        setFollowerCount(prev => prev + 1)
      }
    } catch (err) {
      console.error('Follow error:', err)
    } finally {
      setLoadingFollow(false)
    }
  }

  const handleShare = async () => {
    if (currentIndex >= pets.length) return
    const currentPet = pets[currentIndex]
    const url = `${window.location.origin}/pets/${currentPet.id}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: currentPet.name,
          url: url,
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(url)
        alert('Link copied to clipboard!')
      }
    } catch (err) {
      console.error('Share error:', err)
    }
  }

  const advanceCard = () => {
    setCurrentIndex(prev => {
      const next = prev + 1
      return next < pets.length ? next : prev
    })
  }

  // Handle scroll/swipe
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 0) {
      advanceCard()
    }
  }

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        advanceCard()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, pets.length])

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

  const currentPet = currentIndex < pets.length ? pets[currentIndex] : null

  if (!currentPet) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--app-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</p>
        <h1 style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: '32px',
          fontWeight: 400,
          fontStyle: 'italic',
          color: 'var(--ink)',
          marginBottom: '12px',
          textAlign: 'center',
        }}>
          You've seen them all!
        </h1>
        <p style={{
          fontSize: '13px',
          color: 'var(--ink-2)',
          marginBottom: '32px',
          textAlign: 'center',
          maxWidth: '300px',
        }}>
          Check back later for more pets to discover.
        </p>
        <Link href="/profile" style={{
          padding: '12px 28px',
          background: 'var(--ink)',
          color: '#fff',
          textDecoration: 'none',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.5px',
          borderRadius: '0px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 180ms ease',
          display: 'inline-block',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)')}
        >
          View Your Pets
        </Link>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--app-bg)',
      display: 'flex',
      flexDirection: 'column',
      onWheel: handleWheel,
    } as any}>
      {/* Carousel Card - Full Screen */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Main Image/Photo */}
        <div style={{
          flex: 1,
          backgroundColor: '#e5e1d7',
          backgroundImage: currentPet.cover_url || currentPet.avatar_url ? `url(${currentPet.cover_url || currentPet.avatar_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'flex-end',
        }} onClick={advanceCard}>
          {/* Dark overlay for text readability */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent 60%)',
            pointerEvents: 'none',
          }} />

          {/* Content Overlay at Bottom */}
          <div style={{
            position: 'relative',
            width: '100%',
            padding: '24px 20px 40px',
            color: '#fff',
          }}>
            {/* Pet Name and Species */}
            <div style={{ marginBottom: '16px' }}>
              <h1 style={{
                fontFamily: '"Instrument Serif", Georgia, serif',
                fontSize: '36px',
                fontWeight: 400,
                fontStyle: 'italic',
                margin: '0 0 4px 0',
                lineHeight: 1,
              }}>
                {currentPet.name}
              </h1>
              <p style={{
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                margin: '0 0 8px 0',
                opacity: 0.9,
              }}>
                {currentPet.species}{currentPet.breed ? ` · ${currentPet.breed}` : ''}
              </p>
            </div>

            {/* Bio if exists */}
            {currentPet.bio && (
              <p style={{
                fontSize: '13px',
                fontWeight: 400,
                lineHeight: 1.5,
                margin: '0 0 16px 0',
                opacity: 0.95,
              }}>
                "{currentPet.bio}"
              </p>
            )}

            {/* Follower Count */}
            <div style={{
              textAlign: 'right',
            }}>
              <p style={{
                fontSize: '20px',
                fontWeight: 700,
                margin: '0 0 2px 0',
              }}>
                {followerCount.toLocaleString()}
              </p>
              <p style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                margin: 0,
                opacity: 0.8,
              }}>
                Followers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        padding: '20px',
        background: 'var(--paper)',
        borderTop: '1px solid var(--line)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
      }}>
        {/* Follow Button */}
        <button
          onClick={handleFollow}
          disabled={loadingFollow}
          style={{
            padding: '14px 16px',
            background: isFollowing ? 'var(--ink)' : 'var(--acc)',
            color: '#fff',
            border: 'none',
            borderRadius: '0px',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.4px',
            cursor: loadingFollow ? 'not-allowed' : 'pointer',
            opacity: loadingFollow ? 0.7 : 1,
            transition: 'all 160ms ease',
            boxShadow: isFollowing ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(8, 145, 178, 0.2)',
          }}
          onMouseEnter={(e) => !loadingFollow && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = isFollowing ? '0 8px 20px rgba(0, 0, 0, 0.2)' : '0 6px 16px rgba(8, 145, 178, 0.3)')}
          onMouseLeave={(e) => !loadingFollow && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = isFollowing ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(8, 145, 178, 0.2)')}
        >
          {isFollowing ? '✓ Following' : '+ Follow'}
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          style={{
            padding: '14px 16px',
            background: 'transparent',
            color: 'var(--acc)',
            border: '1.5px solid var(--acc)',
            borderRadius: '0px',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.4px',
            cursor: 'pointer',
            transition: 'all 160ms ease',
            boxShadow: '0 2px 6px rgba(8, 145, 178, 0.1)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--acc)', e.currentTarget.style.color = '#fff', e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 145, 178, 0.25)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--acc)', e.currentTarget.style.boxShadow = '0 2px 6px rgba(8, 145, 178, 0.1)')}
        >
          ↗ Share
        </button>
      </div>

      {/* Navigation Info */}
      <div style={{
        padding: '12px 20px',
        background: 'var(--paper)',
        textAlign: 'center',
        borderTop: '1px solid var(--line)',
        fontSize: '11px',
        color: 'var(--ink-2)',
        fontWeight: 500,
      }}>
        {currentIndex + 1} / {pets.length} · Scroll or tap to next
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
        background: 'rgba(250, 250, 247, 0.92)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--line)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
      }}>
        {[
          { icon: 'explore', label: 'Explore', href: '/stack', active: true },
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
              gap: '4px',
              textDecoration: 'none',
              opacity: tab.active ? 1 : 0.5,
              transition: 'opacity 160ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = tab.active ? '1' : '0.5')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: tab.active ? 'var(--acc)' : 'var(--ink)' }}>
              {tab.icon === 'explore' && (
                <>
                  <circle cx="12" cy="7" r="1.2" />
                  <circle cx="8" cy="11" r="1.2" />
                  <circle cx="16" cy="11" r="1.2" />
                  <circle cx="9" cy="16" r="1.2" />
                  <circle cx="15" cy="16" r="1.2" />
                  <circle cx="12" cy="13" r="1.8" />
                </>
              )}
              {tab.icon === 'create' && (
                <>
                  <circle cx="12" cy="13" r="2" />
                  <circle cx="9" cy="9" r="1" />
                  <circle cx="15" cy="9" r="1" />
                  <circle cx="8" cy="15" r="1" />
                  <circle cx="16" cy="15" r="1" />
                  <line x1="12" y1="5" x2="12" y2="21" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="4" y1="13" x2="20" y2="13" stroke="currentColor" strokeWidth="1.2" />
                </>
              )}
              {tab.icon === 'profile' && (
                <>
                  <path d="M9 5 L9 5 L6 8 Q6 6 9 5" fill="currentColor" />
                  <path d="M15 5 L15 5 L18 8 Q18 6 15 5" fill="currentColor" />
                  <circle cx="12" cy="10" r="2" />
                  <ellipse cx="12" cy="16" rx="4" ry="3" />
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
