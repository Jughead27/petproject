'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()

        if (!userData.user) {
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('notifications')
          .select('id', { count: 'exact' })
          .eq('recipient_id', userData.user.id)
          .eq('is_read', false)

        if (!error && data) {
          setUnreadCount(data.length)
        }

        setLoading(false)
      } catch (err) {
        console.error('Fetch unread count error:', err)
        setLoading(false)
      }
    }

    fetchUnreadCount()

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Link href="/notifications" className="relative inline-block">
      <button className="relative text-gray-700 hover:text-amber-600 transition-colors">
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </Link>
  )
}
