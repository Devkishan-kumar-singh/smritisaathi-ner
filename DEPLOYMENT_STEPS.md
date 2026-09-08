# SmritiSaathi NER v3 — Final Deployment Steps

## 1. Update the existing Supabase database

Open Supabase **SQL Editor**, paste all contents of `supabase/migration_v3_auth_onboarding.sql`, and run it once. This enables a newly verified user to create an isolated family and patient profile.

## 2. Connect Resend to Supabase Auth

1. Verify a sending domain and create an API key in Resend.
2. In Supabase open **Authentication → Email/Notifications → SMTP Settings**.
3. Enable custom SMTP and enter:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: your Resend API key
   - Sender: an email address on the verified domain
4. Edit the Supabase sign-in/magic-link email template and display `{{ .Token }}` as the one-time code.
5. Never put the Resend API key in Render, GitHub, `.env`, or frontend code.

## 3. Deploy through the existing GitHub and Render service

Replace the existing project contents with this package, but keep your local `.env` file private. Commit and push to the same `main` branch. Render needs only `SUPABASE_URL` and `SUPABASE_ANON_KEY`; no new Render secret is required.

## 4. Final checks

- Test password sign-up, email confirmation, and password login.
- Test email OTP request and six-digit code verification.
- Test first-time family setup.
- Log out, sign in again, and confirm the same family data appears.
- Confirm another account cannot access the first family's photos or records.
- Hard-refresh once after deployment so service-worker version 6 replaces the previous cache.
