# SmritiSaathi NER v5 — Final Deployment Steps

## 1. Update the existing Supabase database

Open Supabase **SQL Editor**, paste all contents of `supabase/migration_v4_family_code_shared_roles.sql`, and run it once. This enables secure onboarding, assigns a readable unique family ID, and updates existing families.

## 2. OTP/Resend status

This build does not change Bhashini or Resend. Keep the existing password authentication working. Connect custom OTP email delivery later, after the offline-first patient workflow is accepted.

## 3. Deploy through the existing GitHub and Render service

Replace the existing project contents with this package, but keep your local `.env` file private. Commit and push to the same `main` branch. Render uses the same existing Supabase environment variables; this update adds no new secret.

## 4. Final checks

- Test password sign-up, email confirmation, and password login.
- Test email OTP request and six-digit code verification.
- Test first-time family setup.
- Confirm the unique family ID appears after login.
- Confirm the shared login asks the user to choose Patient or Caregiver.
- Log out, sign in again, and confirm the same family data appears.
- Confirm another account cannot access the first family's photos or records.
- On a phone, confirm the page has no horizontal overflow and all four bottom-navigation items remain visible.
- Choose a voice in Settings, press **Test reminder voice**, and confirm the choice remains after refresh.
- On the Patient Home page, press **Enable reminder sound** once on each device/browser.
- In Caregiver Reminders, press **Play now** to verify the exact saved message immediately.
- Create a reminder two minutes ahead, keep the PWA open, and verify the beep, spoken message and system notification.
- Add a family photo with a personal clue; confirm the clue is spoken in the family-recognition activity.
- While the page is open, turn off the internet, add a reminder/photo/game result, restore the internet and confirm automatic sync.
- Refresh while using the Patient dashboard and confirm the same role/page returns without another role selection.
- Hard-refresh once after deployment so service-worker version 8 replaces the previous cache. If an old layout remains, clear this site's cached data once and reopen it.

Audible reminders work online and offline while the site/PWA is open. A fully closed browser cannot be awakened reliably by this web prototype.
