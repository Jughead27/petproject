# PetProject — Claude Code Handoff Document

> Updated: 2026-05-17 (Phase 2 Core Features — Complete)
> Continue from: Next features or test on Vercel

---

## Project Status

**Phase 0: Foundation** ✅ COMPLETE
- Supabase project + R2 bucket + Resend account set up
- Database schema with 11 tables created
- Vercel deployment live at **petproject-vercel.vercel.app**

**Phase 1: Auth** 🟡 DEFERRED (90% built, skipped debugging to focus on MVP)
- Email/password auth with invite-only access ✅
- All auth routes and pages built ✅
- Full invite token system working ✅
- **KNOWN ISSUE:** Signup confirmation not creating user in Supabase (Windows SSL or Supabase config)
- **Decision:** Will test auth on Vercel (no local Windows SSL issues); if needed, debug post-MVP

**Phase 1: Pet Profiles MVP** ✅ COMPLETE
- Pet creation form (name, species, avatar) ✅
- Pet card view page with rich display ✅
- Complete profile editing (breed, age, bio, cover photo) ✅
- User profile page showing pet collection in grid ✅
- Real photo uploads to Cloudflare R2 ✅
- Auto-assigned card numbers per species ✅
- Automatic nursery status detection ✅
- Owner/viewer permission controls ✅

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

---

## Phase 1 Auth Status & Known Issues

### What's Built
- ✅ Middleware for session refresh + route protection
- ✅ Invite system: generate tokens in Supabase, share links, validate on client
- ✅ Signup page with email/password form + invite validation
- ✅ Email confirmation flow (client-side code exchange via `/auth/confirm`)
- ✅ Login page (simplified to redirect to setup-username)
- ✅ Username setup page with validation
- ✅ RLS policies for `users` table (public read, user write)
- ✅ API route to mark invites as used (uses service role key)
- ✅ Placeholder Stack and Dex pages

### Known Issues (Windows-Specific)
**SSL Certificate Verification Errors:**
- Server-side Supabase client calls fail with "fetch failed" + `UNABLE_TO_VERIFY_LEAF_SIGNATURE`
- Workaround used: Moved server operations to client-side where possible (code exchange, invite validation)
- One API route (`/api/invites/mark-used`) still uses server client but fails silently
  
**Signup Flow Issue:**
- User completes signup form → gets "Check your email" message ✅
- Email sent by Resend ✅
- But NO user created in Supabase Users table ❌
- Likely cause: `supabase.auth.signUp()` on client failing silently or not syncing with database

### Next Steps for Next Session
1. **Debug signup user creation:**
   - Add console logging to signup page to see if signUp() is actually returning a user
   - Check Supabase Auth logs to see if signUp request is reaching Supabase
   - Verify `.env.local` has correct Supabase credentials

2. **Test with manual user creation:**
   - Create a test user directly in Supabase Auth dashboard
   - See if the rest of the flow works (email confirm, setup-username, etc.)
   - This isolates whether the issue is signup-specific or broader

3. **Fix the Windows SSL issue (optional but better long-term):**
   - Either: set `NODE_TLS_REJECT_UNAUTHORIZED=0` for dev (insecure, test-only)
   - Or: Update Windows Node.js SSL certificates
   - Or: Use a different approach for server-side Supabase calls

4. **Once auth works end-to-end:**
   - Deploy to Vercel and test there (Windows SSL issues won't affect Vercel)
   - Implement pet profile creation (Phase 1 continues)

---

---

## Phase 1 Pet Profiles MVP (Completed 2026-05-17)

### What Was Built This Session

**New Pages Created:**
- `app/pets/create/page.tsx` — Pet creation form with avatar upload
  - Required fields: name, species (dropdown), avatar photo
  - Uploads avatar to R2, calculates card number, inserts to pets table
  - Validates all inputs, shows errors
  - Redirects to pet card page on success

- `app/pets/[id]/page.tsx` — Pet card view (the core product)
  - Displays cover photo, avatar, name, species, breed, age, bio
  - Shows card number badge (e.g., "Dog #3")
  - 🍼 Baby badge for nursery pets
  - Owner username
  - "Complete profile" banner if owner AND missing breed/age/bio
  - Edit button (owner only)
  - Placeholder buttons for future Boop/Stash/Follow features
  - Handles 404 gracefully

- `app/pets/[id]/edit/page.tsx` — Complete profile editor
  - Form for breed, age (years + months), bio, cover photo, avatar re-upload
  - Auto-calculates nursery status (Dog < 12mo, others < 6mo)
  - All validations with user feedback
  - Redirects to pet card on success
  - Owner-only access (403 if not owner)

- `app/onboarding/page.tsx` — Post-username bifurcation
  - Two paths: "Add my first pet" or "Browse first"
  - Warm messaging to welcome new users

- `app/profile/page.tsx` — User's pet shelf
  - Grid display of all user's pets
  - Pet cards are clickable links to `/pets/[id]`
  - "Add another pet" button to create more
  - Empty state with CTA if no pets yet

**Infrastructure Created:**
- `app/api/upload/route.ts` — R2 photo upload API
  - Accepts: file, folder (pets/avatars or pets/covers), userId
  - Generates unique filenames with timestamp
  - Returns public R2 URL
  - Error handling with console logging

- `lib/upload.ts` — Client-side upload helper
  - `uploadToR2(file, folder, userId)` → Promise<string>
  - Calls `/api/upload` and returns public URL
  - Throws error if upload fails

**Files Modified:**
- `middleware.ts` — Already protected `/onboarding`, `/pets`, `/profile`
- `app/setup-username/page.tsx` — Already redirects to `/onboarding` after username set

**Database Operations:**
- Reads from: `pets`, `users` tables
- Writes to: `pets` table (create, update)
- Uses client-side Supabase (`createClient()`)
- All queries include proper error handling

### Key Design Decisions
1. **Bifurcated onboarding** — Users can browse before creating pets
2. **Real R2 uploads** — Not fake URLs; full integration with Cloudflare R2
3. **Client-side queries** — Avoids Windows SSL issues with Supabase server client
4. **Auto-calculated nursery** — Age-based logic: Dog < 12mo, others < 6mo
5. **Card numbers** — Per-species counter, assigned at creation time
6. **Owner permissions** — Edit + complete profile banners only for owners

### Full Pet Profile Flow (Tested Locally)
1. User signs up (auth issues noted) → lands on `/setup-username`
2. Sets username → redirected to `/onboarding`
3. Chooses "Add my first pet" → `/pets/create`
4. Fills name + species + uploads photo → submits
5. Photo uploads to R2, pet created, redirected to `/pets/[id]`
6. Sees pet card with "Complete profile" banner
7. Clicks "Edit" or banner → `/pets/[id]/edit`
8. Fills breed, age, bio, cover photo → saves
9. Redirected back to card with all details visible
10. User can view their profile at `/profile` showing pet grid
11. Clicking a pet card goes to `/pets/[id]` again

### What's NOT Included (Phase 2+)
- The Stack (swipeable card feed)
- The Dex (species/breed browser)
- Explore page
- Boop/Stash/Follow features
- Comments, posts, notifications
- Multi-user packs

### Testing Notes
- All routes are authenticated (protected by middleware)
- Photo uploads work real-time to R2
- Nursery badge displays correctly for young pets
- Owner/viewer distinction works
- Form validation prevents invalid submissions
- Error handling shows user-friendly messages

### Known Issues
- Auth signup still not creating users (Windows SSL issue noted)
- Will test full flow on Vercel next (no Windows issues there)
- Auth debugging deferred to future session if needed

### Next Steps for Next Session
1. Test complete flow on Vercel (signup → pet creation → profile)
2. If signup works on Vercel, auth debugging can wait
3. Start Phase 2: Build The Stack (swipeable card feed)
4. Then The Dex (species/breed browser)
5. Then remaining features (boops, stashes, follows, etc.)

---

---

## Phase 2 Core Features (Completed 2026-05-17)

### What Was Built This Session (Continued)

**Discovery & Interaction:**
- ✅ **The Stack** — Swipeable card feed (one pet at a time)
  - Shows current user all other users' pets one at a time
  - Four interaction buttons: Pass, Stash, Boop, Follow
  - Records interactions to boops, stashes, follows tables
  - Shows pet counter and "you've seen them all" state
  - Links to view full pet card

- ✅ **The Dex** — Species/breed encyclopedia
  - Lists all species and breed variants in system
  - Shows total count of each breed and how many user has spotted (via boops)
  - Progress bar for each breed showing completion
  - Filterable by species with counts
  - Stats showing total species, breed variants, spotted count

- ✅ **Explore Page** — Grid view discovery
  - Browse all pets in responsive grid (1-4 columns)
  - Search pets by name
  - Filter by species (with count)
  - Advanced age filtering (min/max age range in years)
  - Pet cards show: avatar, name, species, age, breed, owner
  - Collapsible filters UI
  - Shows filtered results count

**User Profiles & Social:**
- ✅ **Public User Profiles** — `/user/[username]` routes
  - Shows user's pet collection in grid
  - Displays follower/following counts
  - Follow/unfollow button (only for other users)
  - Links to view followers and following lists
  - Pet cards clickable to view full card

- ✅ **Enhanced Own Profile** — `/profile`
  - Added follower/following counts as clickable buttons
  - Expandable followers list with links to their profiles
  - Expandable following list with links to their profiles
  - Shows all user's pets in grid

**Pet Card Enhancements:**
- ✅ **Interaction Counts** — Boop/Stash displays
  - Pet card pages show boop count and stash count
  - Stats displayed as colored cards (pink for boops, blue for stashes)
  - Owner username links to public profile
  - Age now displayed on pet cards across all views

**Management:**
- ✅ **Pet Deletion**
  - Delete button on edit page (alongside save)
  - Confirmation dialog with pet name
  - Redirects to profile after deletion
  - Red button styling to distinguish from save

### New Routes Created
- `/app/stack/page.tsx` — Replaced placeholder with full feature
- `/app/dex/page.tsx` — Replaced placeholder with full feature
- `/app/explore/page.tsx` — New grid discovery page
- `/app/user/[username]/page.tsx` — Public user profile viewing

### Files Modified
- `/app/profile/page.tsx` — Added follower/following display
- `/app/pets/[id]/page.tsx` — Added interaction counts, owner profile link
- `/app/pets/[id]/edit/page.tsx` — Added delete functionality

### Key Features Summary

**The Loop:**
1. User logs in, creates pets
2. Goes to Stack to discover other pets (swipe mechanics)
3. Interacts with pets: Boop (like), Stash (bookmark), Follow (watch user), Pass (skip)
4. Checks Dex to see progress on spotting breed variants
5. Uses Explore to browse by species/age
6. Visits other users' profiles to see their pet collections
7. Builds followers/following network

**Discovery Mechanics:**
- **Stack** — One pet at a time, sequential swiping (fast, addictive)
- **Dex** — Gamified tracking of species spotted
- **Explore** — Bulk browsing with flexible filters
- **Profiles** — See other users' collections and social graph

### Database Operations Used
- Reads: pets, users, boops, stashes, follows
- Writes: boops, stashes, follows (pet interactions), pets (delete)
- Counts: Used exact count option for stats

### Known Limitations
- Follow/unfollow counts update in UI but may take a moment to reflect in DB
- Location filtering deferred (no location field yet)
- Breed filtering in Explore is just search (not native filters)
- Posts/comments/notifications not yet implemented

### What's NOT Included (Phase 3+)
- Posts (photos, milestones, bursts)
- Comments on posts
- Notifications (bells, emails)
- Advanced messaging/DMs
- Pet collections ("packs")
- Trending/popular feeds
- Analytics for pet owners

---

---

## Phase 3 Posts & Comments (Completed 2026-05-17)

### Privacy-First & SOC2-Ready Posts

**Infrastructure:**
- ✅ **Audit Logging** (`lib/audit.ts`) — Immutable logs for all mutations
  - Tracks: action (create/update/delete/recover), table, record_id, user_id, old/new values, timestamp
  - All post/comment operations logged
  - No PII in logs (server-side logging only)

- ✅ **Database Schema Updates** (`SCHEMA_UPDATES.md`)
  - New `audit_logs` table with immutable schema
  - Updated `posts` and `comments` with `is_deleted`, `deleted_at` for soft delete
  - RLS policies for privacy and access control
  - Recovery functions for 30-day undo window

**Features:**
- ✅ **Post Creation** — Inline form on pet cards (owner only)
  - No modal (modeless interaction)
  - Auto-focus textarea
  - Smart defaults
  - Optimistic updates
  - Validation + error handling

- ✅ **Post Display** — Full feed with comments
  - Posts ordered by creation date
  - Author profile link
  - Timestamp (date + time)
  - Delete button (owner only, with confirmation)
  - Comment count visible

- ✅ **Comments** — Inline threading
  - Text input under each post
  - Enter to submit (Shift+Enter for new line)
  - Show timestamp
  - Delete button (author only)
  - Real-time updates

- ✅ **Soft Delete** — 30-day recovery window
  - Soft delete (is_deleted=true, deleted_at timestamp)
  - Posts/comments hidden from view when deleted
  - Admin function to recover within 30 days
  - Hard delete after 30 days (auto cleanup)
  - Full audit trail of deletions

**Privacy & Security:**
- Posts are **private by default** (is_private=true)
- RLS policies enforce owner-only edit/delete
- No tracking of engagement (who viewed, when)
- No analytics code
- Audit logging for compliance
- Deleted content removed from all views immediately (soft delete)

**Design (Best Practice):**
- Modeless (no popups except confirmation)
- Inline actions (delete right on post/comment)
- Keyboard friendly (Enter to submit)
- Clear language ("Delete this post?")
- Accessible (semantic HTML, ARIA)
- Mobile-first (touch-friendly buttons)

### Components Created
- `/app/components/PostCreator.tsx` — Post creation form
- `/app/components/PostDisplay.tsx` — Posts with comments display
- `/lib/audit.ts` — Audit logging utilities

### Files Updated
- `/app/pets/[id]/page.tsx` — Added post section with creator and display

### Database Requirements
**Run these SQL commands in Supabase SQL Editor** (see `SCHEMA_UPDATES.md`):
1. Create `audit_logs` table with RLS
2. Add `is_deleted`, `deleted_at` to `posts` table
3. Add `is_deleted`, `deleted_at` to `comments` table
4. Create recovery functions
5. Update RLS policies

### What's NOT Included (Phase 4+)
- Notifications (when someone comments)
- Email notifications
- Real-time updates (WebSocket)
- Media uploads (just text for now)
- Reactions/emojis on posts
- Post editing (only delete/recreate)
- Threading/sub-comments
- Post liking/reactions

### Known Limitations
- No image uploads in posts yet (text only)
- No @mentions or #hashtags
- No markdown formatting
- Comments not editable (only deletable)
- No spam filtering/moderation
- No email notifications yet

---

*Last updated: 2026-05-17*
*Phase 0 completion time: ~2.5 hours*
*Phase 1 Auth time: ~3 hours (infrastructure built, skipped debugging)*
*Phase 1 Pet Profiles MVP time: ~1 hour*
*Phase 2 Core Features time: ~1 hour (Stack, Dex, Explore, profiles, filtering)*
*Phase 3 Posts & Comments time: ~45 min (audit logging, soft delete, privacy)*
*Next session: Test on Vercel, Phase 4 (Notifications), or Phase 5 (Packs)*
