import { createClient } from './supabase'

interface AuditLogEntry {
  action: 'create' | 'update' | 'delete' | 'recover'
  table_name: string
  record_id: string
  user_id: string
  old_values?: Record<string, any> | null
  new_values?: Record<string, any> | null
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createClient()

    await supabase.from('audit_logs').insert({
      action: entry.action,
      table_name: entry.table_name,
      record_id: entry.record_id,
      user_id: entry.user_id,
      old_values: entry.old_values || null,
      new_values: entry.new_values || null,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Audit log error:', {
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    })
    // Don't throw - audit logging failure shouldn't break the app
  }
}

export async function logPostCreate(
  userId: string,
  postId: string,
  content: string,
  petId: string
): Promise<void> {
  await logAudit({
    action: 'create',
    table_name: 'posts',
    record_id: postId,
    user_id: userId,
    new_values: { content, pet_id: petId },
  })
}

export async function logPostDelete(userId: string, postId: string, content: string): Promise<void> {
  await logAudit({
    action: 'delete',
    table_name: 'posts',
    record_id: postId,
    user_id: userId,
    old_values: { content },
  })
}

export async function logCommentCreate(
  userId: string,
  commentId: string,
  content: string,
  postId: string
): Promise<void> {
  await logAudit({
    action: 'create',
    table_name: 'comments',
    record_id: commentId,
    user_id: userId,
    new_values: { content, post_id: postId },
  })
}

export async function logCommentDelete(
  userId: string,
  commentId: string,
  content: string
): Promise<void> {
  await logAudit({
    action: 'delete',
    table_name: 'comments',
    record_id: commentId,
    user_id: userId,
    old_values: { content },
  })
}
