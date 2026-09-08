# SmritiSaathi NER v5 — SIH 26003

Strong functional prototype for a private, offline-friendly, multilingual cognitive gaming and memory-assistance platform for elderly people with dementia in North-East India.

## Functional features

- Patient and caregiver experiences
- Nine activities covering memory, attention, routine, recognition, language and orientation
- Uploadable family photographs and personal memory clues
- Adaptive help with fewer choices, voice cues and no punishment
- Full patient UI, game choices, hints and spoken feedback in English, Hindi, Assamese, Manipuri, Khasi and Mizo
- English, Hindi, Assamese, Manipuri, Khasi and Mizo selector
- Medicine, hydration, meal, walk and appointment reminders
- Engagement dashboard using accuracy, response time and hints—not a diagnostic score
- Offline cache and local queue
- Refresh-safe patient/caregiver session and last-page restoration
- Automatic queued photo, reminder and game-session sync after reconnection
- Audible local reminders while the web app/PWA remains open, online or offline
- Caregiver-written personal clues spoken during the family-recognition game
- A persistent device-voice selector for consistent voice choice on each device
- Responsive mobile layout with large controls and no horizontal page overflow
- Supabase Auth, PostgreSQL, private Storage and family-level RLS schema
- Password login, email OTP login and secure first-family onboarding
- One shared family login with a Patient/Caregiver choice after authentication
- Human-readable unique family codes derived from the chosen family name
- Render Node.js deployment configuration

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`. Demo mode works without credentials.

## Connect Supabase

1. Create a dedicated Supabase project.
2. Run `supabase/schema.sql` in its SQL Editor.
3. Existing database: run `supabase/migration_v4_family_code_shared_roles.sql` once. It includes the onboarding function and unique family-code update. New databases receive these through `schema.sql`.
4. Open `ENV_EDIT_ME.txt`, add the URL and publishable key, then rename it to exactly `.env`.
5. New users can now create their own isolated family space after their first verified login. `seed_template.sql` is only for presentation demo data.
6. Never put a service-role key in the browser, GitHub or Render frontend.

Every patient record, photo, reminder and session has a `family_id`. Row Level Security compares it with the authenticated user's profile. Private photo paths also begin with that family UUID, so another family cannot read either the row or image object.

## Email OTP through Resend

1. Verify your sending domain in Resend and create a Resend API key.
2. In Supabase open **Authentication → Email/Notifications → SMTP Settings** and enable custom SMTP.
3. Enter host `smtp.resend.com`, port `465`, username `resend`, and use the Resend API key as the SMTP password. Use an address on your verified domain as the sender.
4. In the Supabase magic-link email template, show `{{ .Token }}` as the one-time code. Do not use only `{{ .ConfirmationURL }}`, because that produces a magic link instead of the typed OTP used by this interface.
5. Keep the Resend API key only inside Supabase SMTP settings. Do not add it to GitHub, frontend JavaScript, or Render.

## Render

Push this folder to GitHub. In Render select **New → Blueprint**, connect the repository and use `render.yaml`. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` as environment variables.

## Medical boundary

This supports engagement and caregiver coordination. It does not diagnose, treat or cure dementia. Clinical, caregiver, patient, ethics and privacy review are required before a real-world pilot.

## Browser reminder boundary

Offline reminders and speech work while the installed PWA or browser page is open. An ordinary web page cannot reliably wake a fully closed browser at an exact time. Guaranteed closed-app alarms require a native Android wrapper/background scheduler or approved web-push service in a later production phase.
