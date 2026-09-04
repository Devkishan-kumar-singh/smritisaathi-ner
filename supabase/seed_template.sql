-- STEP 1: In Supabase Authentication > Users, create a caregiver user.
-- Copy that user's UUID and replace CAREGIVER_AUTH_USER_UUID below.

with new_family as (
  insert into public.families(name)
  values ('Bordoloi Family')
  returning id
), new_profile as (
  insert into public.profiles(id,family_id,role,display_name,preferred_language)
  select 'CAREGIVER_AUTH_USER_UUID'::uuid,id,'caregiver','Riya Bordoloi','as'
  from new_family
  returning family_id
)
insert into public.patients(family_id,preferred_name,birth_year)
select family_id,'Anima Khuri',1952 from new_profile;

-- To add a second family, run this script again with a DIFFERENT auth user UUID
-- and family name. RLS will keep both families completely separate.
