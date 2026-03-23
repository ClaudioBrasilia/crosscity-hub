

# Add Profile Photo Upload

## Current State
- Profile uses emoji avatars only (text field `avatar` in `profiles` table)
- No `avatar_url` column exists
- No storage bucket for profile images
- Avatar is displayed as emoji text throughout the app

## What Needs to Change

### 1. Database: Add `avatar_url` column to `profiles`
- Add nullable `text` column `avatar_url` to `profiles`
- Update the anon SELECT policy (already exists) -- no change needed since it covers all columns

### 2. Storage: Create `avatars` bucket
- Create public bucket `avatars`
- RLS policies: users can upload/update/delete their own files, anyone can view

### 3. Profile Page (`src/pages/Profile.tsx`)
- Add photo upload section above the emoji avatar selector
- Show current photo with option to change/remove
- Validate: only images (jpg/png/webp), max 2MB
- Upload to `avatars/{user.id}/profile.{ext}`
- Save URL to `profiles.avatar_url`
- Show photo as circular avatar, fallback to emoji if no photo

### 4. AuthContext (`src/contexts/AuthContext.tsx`)
- Add `avatarUrl?: string` to User interface
- Map `avatar_url` from DB in `fetchUserProfile` and `getAllUsers`
- Handle `avatarUrl` in `updateUser`

### 5. Display in key places
- Profile page header: show photo instead of emoji when available
- Layout/sidebar: show photo if available (check Layout.tsx for avatar usage)
- Fallback: if no `avatar_url`, show emoji avatar as before

## Files Modified
1. **Migration SQL** -- add `avatar_url` column + `avatars` bucket + storage policies
2. **`src/contexts/AuthContext.tsx`** -- add `avatarUrl` to User type, map from DB
3. **`src/pages/Profile.tsx`** -- add upload UI section, display photo
4. **`src/components/Layout.tsx`** -- display photo in sidebar/header if available

## What Does NOT Change
- Login/register flow
- Dashboard, WOD, CoachDashboard, Battle, Feed, Leaderboard
- Check-in logic, duels, ranking
- localStorage structure
- Emoji avatar system (kept as fallback)

## Technical Details

### Upload Flow
```
User selects file → validate type/size → upload to Supabase Storage
→ get public URL → update profiles.avatar_url → update local state
```

### Storage Path Convention
`avatars/{userId}/profile.jpg` (overwritten on each upload)

### Fallback Logic
```
avatarUrl exists → show <img> in circular container
avatarUrl missing → show emoji avatar (current behavior)
```

