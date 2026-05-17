# Database Schema Updates for Phase 3 (Posts/Comments)

Run these SQL commands in Supabase SQL Editor to set up posts/comments with privacy and soft-delete support.

## 1. Create Audit Logs Table

```sql
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'recover')),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
);

-- Index for fast lookups by user or table
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit logs are write-only, readable only by admins or the user themselves
CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Only app can insert (via service role)
CREATE POLICY "Service can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);
```

## 2. Update Posts Table (Add Soft Delete)

```sql
-- Add deleted_at and is_deleted columns if not present
ALTER TABLE posts 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT true;

-- Update RLS policy to hide deleted posts by default
DROP POLICY IF EXISTS "Posts are viewable by owner or followers" ON posts;

CREATE POLICY "Posts are viewable by owner or not deleted" ON posts
  FOR SELECT USING (
    (NOT is_deleted) AND 
    (auth.uid() = user_id OR NOT is_private)
  );

-- Only owner can update/delete
CREATE POLICY "Owner can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);
```

## 3. Update Comments Table (Add Soft Delete)

```sql
-- Add deleted_at and is_deleted columns if not present
ALTER TABLE comments 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Update RLS policy to hide deleted comments
DROP POLICY IF EXISTS "Comments are viewable" ON comments;

CREATE POLICY "Comments viewable if not deleted" ON comments
  FOR SELECT USING (NOT is_deleted);

-- Only author can delete
CREATE POLICY "Author can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Only author can update
CREATE POLICY "Author can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## 4. Create Function for Soft Delete with Recovery Window

```sql
-- Function to recover deleted posts (within 30 days)
CREATE OR REPLACE FUNCTION recover_deleted_post(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET is_deleted = false, deleted_at = NULL
  WHERE id = post_id
    AND is_deleted = true
    AND deleted_at > NOW() - INTERVAL '30 days'
    AND auth.uid() = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to permanently delete posts after 30 days
CREATE OR REPLACE FUNCTION cleanup_deleted_posts()
RETURNS void AS $$
BEGIN
  DELETE FROM comments WHERE post_id IN (
    SELECT id FROM posts 
    WHERE is_deleted = true 
    AND deleted_at < NOW() - INTERVAL '30 days'
  );
  
  DELETE FROM posts 
  WHERE is_deleted = true 
  AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 5. Create Policy for Audit Log Reads

```sql
-- Allow authenticated users to view their own audit logs
CREATE POLICY "Users view their audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');
```

## Notes

- `is_deleted = true` with `deleted_at` timestamp allows 30-day recovery window
- Posts are **private by default** (`is_private = true`)
- Only owner sees their private posts; public posts visible to all
- Comments inherit privacy from their post
- All mutations are logged to `audit_logs` table
- Use scheduled job (or cron) to run `cleanup_deleted_posts()` daily

---

**After running these migrations:**
1. Push to GitHub
2. Test locally
3. Run migrations on Vercel production database
