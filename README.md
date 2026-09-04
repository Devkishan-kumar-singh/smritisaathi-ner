# SmritiSaathi NER v2 — SIH 26003

Strong functional prototype for a private, offline-friendly, multilingual cognitive gaming and memory-assistance platform for elderly people with dementia in North-East India.

## Functional features

- Patient and caregiver experiences
- Nine activities covering memory, attention, routine, recognition, language and orientation
- Uploadable family photographs and personal memory clues
- Adaptive help with fewer choices, voice cues and no punishment
- English, Hindi, Assamese, Manipuri, Khasi and Mizo selector
- Medicine, hydration, meal, walk and appointment reminders
- Engagement dashboard using accuracy, response time and hints—not a diagnostic score
- Offline cache and local queue
- Supabase Auth, PostgreSQL, private Storage and family-level RLS schema
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
3. Create users in Authentication and add their `profiles` rows using one family ID.
4. Open `ENV_EDIT_ME.txt`, add the URL and publishable key, then rename it to exactly `.env`.
5. Create a caregiver in **Authentication → Users**, copy the user UUID, replace the placeholder in `supabase/seed_template.sql`, and run that file in SQL Editor.
6. Never put a service-role key in the browser, GitHub or Render frontend.

Every patient record, photo, reminder and session has a `family_id`. Row Level Security compares it with the authenticated user's profile. Private photo paths also begin with that family UUID, so another family cannot read either the row or image object.

## Render

Push this folder to GitHub. In Render select **New → Blueprint**, connect the repository and use `render.yaml`. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` as environment variables.

## Medical boundary

This supports engagement and caregiver coordination. It does not diagnose, treat or cure dementia. Clinical, caregiver, patient, ethics and privacy review are required before a real-world pilot.
