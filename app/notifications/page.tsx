'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { markAsRead, markAllAsRead, deleteNotification } from '@/lib/notifications'

interface Notification {
  id: string
  type: 'comment' | 'boop' | 'follow' | 'post'
  recipient_id: string
  actor_id: string
  pet_id: string | null
  post_id: string | null
  comment_id: string | null
  message: string
  is_read: boolean
  created_at: string
}

interface Actor {
  username: string
}

interface NotificationWithActor extends Notification {
  actor: Actor
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [user, setUser] = useState<{ id: string } | null>(null)

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()

        if (!userData.user) {
          router.push('/login')
          return
        }

        setUser(userData.user as { id: string })

        const { data: notifData } = await supabase
          .from('notifications')
          .select(
            `
            id, type, recipient_id, actor_id, pet_id, post_id, comment_id,
            message, is_read, created_at,
            actor:actor_id(username)
          `
          )
          .eq('recipient_id', userData.user.id)
          .order('created_at', { ascending: false })

        if (notifData) {
          const notifications = notifData.map((notif: any) => ({
            ...notif,
            actor: {
              username: (Array.isArray(notif.actor) ? notif.actor[0]?.username : notif.actor?.username) || 'Unknown',
            },
          }))
          setNotifications(notifications)
        }

        setLoading(false)
      } catch (err) {
        console.error('Load notifications error:', err)
        setLoading(false)
      }
    }

    loadNotifications()
  }, [router])

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId)
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    )
  }

  const handleMarkAllAsRead = async () => {
    if (!user) return
    await markAllAsRead(user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId)
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
  }

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <p className="text-gray-600">Loading notifications...</p>
      </div>
    )
  }

  const getEmoji = (type: string) => {
    switch (type) {
      case 'comment':
        return '💬'
      case 'boop':
        return '💕'
      case 'follow':
        return '👁️'
      default:
        return '🔔'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-gray-600 mt-1">
                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Link href="/stack" className="text-amber-600 hover:text-amber-700 font-medium">
            ← Back
          </Link>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-gray-700 hover:bg-amber-50'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-gray-700 hover:bg-amber-50'
            }`}
          >
            Unread ({unreadCount})
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="ml-auto text-amber-600 hover:text-amber-700 font-medium text-sm"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications list */}
        {filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-white rounded-lg p-4 shadow transition-colors ${
                  !notif.is_read ? 'border-l-4 border-amber-500 bg-amber-50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{getEmoji(notif.type)}</span>
                      <p className="font-medium text-gray-900">{notif.message}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(notif.created_at).toLocaleDateString()} •{' '}
                      {new Date(notif.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-xs text-amber-600 hover:text-amber-700 font-medium whitespace-nowrap"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Quick action links */}
                {notif.pet_id && (
                  <Link
                    href={`/pets/${notif.pet_id}`}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium mt-3 inline-block"
                  >
                    View pet →
                  </Link>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg mb-4">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            {filter === 'unread' && (
              <button
                onClick={() => setFilter('all')}
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                View all notifications
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
