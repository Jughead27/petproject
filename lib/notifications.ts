import { createClient } from './supabase'

export type NotificationType = 'comment' | 'boop' | 'follow' | 'post'

interface NotificationPayload {
  type: NotificationType
  recipient_id: string
  actor_id: string
  pet_id?: string
  post_id?: string
  comment_id?: string
  message: string
}

/**
 * Create a notification for a user action
 * Always use the service role client to bypass RLS
 */
export async function createNotification(payload: NotificationPayload): Promise<void> {
  try {
    const supabase = createClient()

    await supabase.from('notifications').insert({
      type: payload.type,
      recipient_id: payload.recipient_id,
      actor_id: payload.actor_id,
      pet_id: payload.pet_id || null,
      post_id: payload.post_id || null,
      comment_id: payload.comment_id || null,
      message: payload.message,
      is_read: false,
    })
  } catch (err) {
    console.error('Notification creation error:', {
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    })
    // Don't throw - notification failure shouldn't break the action
  }
}

/**
 * Notify pet owner when someone comments on their pet's post
 */
export async function notifyPostComment(
  petOwnerId: string,
  commentAuthorId: string,
  postId: string,
  commentId: string,
  authorUsername: string
): Promise<void> {
  // Don't notify if commenting on own post
  if (petOwnerId === commentAuthorId) return

  await createNotification({
    type: 'comment',
    recipient_id: petOwnerId,
    actor_id: commentAuthorId,
    post_id: postId,
    comment_id: commentId,
    message: `@${authorUsername} commented on your post`,
  })
}

/**
 * Notify pet owner when someone boops their pet
 */
export async function notifyBoop(
  petOwnerId: string,
  booperUserId: string,
  petId: string,
  booperUsername: string
): Promise<void> {
  // Don't notify if booping own pet
  if (petOwnerId === booperUserId) return

  await createNotification({
    type: 'boop',
    recipient_id: petOwnerId,
    actor_id: booperUserId,
    pet_id: petId,
    message: `@${booperUsername} booped your pet! 💕`,
  })
}

/**
 * Notify user when someone follows them
 */
export async function notifyFollow(
  followedUserId: string,
  followerUserId: string,
  followerUsername: string
): Promise<void> {
  await createNotification({
    type: 'follow',
    recipient_id: followedUserId,
    actor_id: followerUserId,
    message: `@${followerUsername} is following you!`,
  })
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('recipient_id', userId)
      .eq('is_read', false)

    if (error || !data) return 0
    return data.length
  } catch (err) {
    console.error('Get unread count error:', err)
    return 0
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  try {
    const supabase = createClient()

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
  } catch (err) {
    console.error('Mark as read error:', err)
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
  try {
    const supabase = createClient()

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('is_read', false)
  } catch (err) {
    console.error('Mark all as read error:', err)
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const supabase = createClient()

    await supabase.from('notifications').delete().eq('id', notificationId)
  } catch (err) {
    console.error('Delete notification error:', err)
  }
}
