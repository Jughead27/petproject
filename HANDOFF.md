# PetProject — Claude Code Handoff Document

> Updated: 2026-05-15 (end of Phase 0)
> Continue from: Phase 1 — MVP

---

## Project Status

**Phase 0: Foundation** ✅ COMPLETE

All core infrastructure is set up and deployed. The site is live at **petproject-vercel.vercel.app** (default Next.js page showing, which confirms deployment works).

---

## What's Been Done

### Infrastructure Setup
- ✅ Supabase project created and tested
- ✅ Cloudflare R2 bucket configured (`petproject-media`)
- ✅ Resend email service connected
- ✅ `.env.local` created with all credentials
- ✅ GitHub repository initialized: `github.com/Jughead27/petproject`

### Libraries & Client Setup
- ✅ Installed `@supabase/supabase-js` and `@supabase/ssr`
- ✅ Created `lib/supabase.ts` (browser client using `createClient()`)
- ✅ Created `lib/supabase-server.ts` (server client using `createServerSupabaseClient()`)
- ✅ Installed `@aws-sdk/client-s3`
- ✅ Created `lib/r2.ts` (Cloudflare R2 S3 client with `r2Client` and `R2_BUCKET`)

### Database
- ✅ Full schema created in Supabase (11 tables):
  - `users`, `pets`, `follows`, `posts`, `boops`, `stashes`, `packs`, `pack_members`, `comments`, `notifications`
  - All relationships and constraints in place
  - Auto-generated UUIDs on primary keys

### Deployment
- ✅ Vercel project created and connected to GitHub
- ✅ All environment variables added to Vercel
- ✅ Site deployed and live: **petproject-vercel.vercel.app**
- ✅ Automatic deployments enabled (every GitHub push)

### Git
- ✅ Initial commit pushed: `Phase 0: Set up Supabase and R2 clients with database schema`

---

## Environment Variables (Already Set Up)

All variables are in `.env.local` and added to Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://yistkelrihfvlndhxftb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CLOUDFLARE_R2_ACCOUNT_ID=578bdad2d1f8ca2124c50914871abfbf
CLOUDFLARE_R2_ACCESS_KEY_ID=7df93a5597aef3340a50d9eed74d4b9c
CLOUDFLARE_R2_SECRET_ACCESS_KEY=9f9d676a5e78efd095feb9a2aa5765497275f078099fc75b314272de235b6899
CLOUDFLARE_R2_BUCKET_NAME=petproject-media
CLOUDFLARE_R2_ENDPOINT=https://578bdad2d1f8ca2124c50914871abfbf.r2.cloudflarestorage.com
RESEND_API_KEY=[REDACTED]
```

---

## Useful Commands (Windows)

```powershell
# Development
npm run dev                    # Start dev server (http://localhost:3000)

# Build & Deploy
Remove-Item -Recurse -Force .next    # Clean .next folder before build (required on Windows!)
npm run build                         # Build for production
npm run start                         # Run production build locally

# Database
# Query Supabase: go to supabase.com dashboard → SQL Editor

# Git (use as separate commands, not chained with &&)
git status
git add .
git commit -m "message"
git push
```

---

## Supabase Client Usage

**In browser components** (Client Components, Server Components with 'use client'):
```typescript
import { createClient } from '@/lib/supabase'

const supabase = createClient()
const { data, error } = await supabase.from('pets').select('*')
```

**In server-side code** (Server Components, API routes):
```typescript
import { createServerSupabaseClient } from '@/lib/supabase-server'

const supabase = await createServerSupabaseClient()
const { data, error } = await supabase.from('users').select('*')
```

---

## R2 Upload Usage

```typescript
import { r2Client, R2_BUCKET } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'

const command = new PutObjectCommand({
  Bucket: R2_BUCKET,
  Key: 'path/to/file.jpg',
  Body: fileBuffer,
  ContentType: 'image/jpeg',
})

await r2Client.send(command)
```

---

## Database Schema Reference

### Users Table
```sql
id (UUID, FK auth.users)
username (text, unique)
display_name (text)
avatar_url (text)
bio (text)
created_at (timestamp)
```

### Pets Table (The Cards)
```sql
id (UUID, primary key)
owner_id (UUID, FK users)
name (text)
species (text)
breed (text)
age_years (numeric)
age_months (numeric)
bio (text)
avatar_url (text)
cover_url (text)
card_number (integer) -- auto-assigned per species
is_nursery (boolean) -- true if age qualifies
nursery_graduated (boolean) -- true after aging out
created_at (timestamp)
```

### Other Tables
- `follows` — pet to pet subscriptions
- `posts` — photos, milestones, bursts
- `boops` — reactions (paw, adorable, silly, goodboy, love)
- `stashes` — saved pet cards
- `packs` — pet groups (household, breed club, etc.)
- `pack_members` — membership join table
- `comments` — post comments
- `notifications` — bells, emails, etc.

All tables have proper foreign keys and cascade delete rules.

---

## Next Phase: Phase 1 — MVP

### What to Build
1. **Auth** — Email/password signup + Google OAuth
2. **Username Setup** — Post-signup flow to choose username
3. **Pet Profiles** — Create, edit, delete pets
4. **Multiple Pets** — Multiple pets per user account
5. **Pet Profile Page** — `/pets/[username]` route
6. **Card Numbers** — Auto-assign per species
7. **Nursery Logic** — Auto-flag babies, track graduation
8. **The Stack** — Swipeable card feed (Boop, Stash, Follow, Pass)
9. **The Dex** — Browse by species/breed, track "spotted"
10. **Explore** — Basic discovery page

### Implementation Order
1. Auth setup + Google OAuth
2. Username setup flow
3. Pet CRUD (create, read, update, delete)
4. Pet profile page with card design
5. Build The Stack component
6. The Dex browser
7. Explore page

### Tech Notes
- Use Next.js App Router (already scaffolded)
- Supabase Auth for user signup/login
- Tailwind for styling
- Supabase RLS (Row Level Security) for data access control

---

## Working Rules (Every Session)

- Always provide **complete file contents** — never partial edits
- Use `npm` not yarn
- Git commands as **three separate commands** (PowerShell limitation)
- Run `Remove-Item -Recurse -Force .next` before every build on Windows
- Verify anchor tags with Ctrl+F after paste (known paste bug)
- Supabase browser client: `import { createClient } from '@/lib/supabase'`
- Supabase server client: `import { createServerSupabaseClient } from '@/lib/supabase-server'`
- Full git push sequence: `git add .` → `git commit -m "..."` → `git push`
- Vim merge commits: Escape then ZZ
- Keep projects (PetProject & Lendleaf) completely separate
- Update this handoff document at the end of each session

---

## Key URLs

- **Live Site:** https://petproject-vercel.vercel.app
- **GitHub:** https://github.com/Jughead27/petproject
- **Supabase Dashboard:** https://app.supabase.com (project: yistkelrihfvlndhxftb)
- **Vercel:** https://vercel.com/dashboard
- **Cloudflare R2:** https://dash.cloudflare.com (bucket: petproject-media)
- **Resend:** https://resend.com/dashboard

---

## Design Reminders

The app should feel **warm, confident, and slightly knowing**:
- Not cute, not pharmaceutical, not overly luxury
- Think Instagram-level polish with community warmth
- Visual reference: The Snout Stack mockups from planning
- No paw print logos
- No Comic Sans energy
- The kind of app someone slightly embarrassed by their pet obsession would actually use

---

## Notes

- James is a non-coder — always provide step-by-step guidance in plain English
- This is Windows Surface ARM — use Windows-specific commands throughout
- `.env.local` contains secrets — never commit it (already in .gitignore)
- npm install on Windows: may need `strict-ssl false` if SSL cert issues arise
  - After install, re-enable: `npm config set strict-ssl true`

---

*Last updated: 2026-05-15*
*Phase 0 completion time: ~2.5 hours*
*Next session: Start Phase 1 — MVP (estimate: 6-8 hours for core features)*
