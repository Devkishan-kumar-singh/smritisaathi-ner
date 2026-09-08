create extension if not exists pgcrypto;
create type public.user_role as enum ('caregiver','patient','health_worker');
create table public.families(id uuid primary key default gen_random_uuid(),name text not null,created_at timestamptz not null default now());
create table public.profiles(id uuid primary key references auth.users(id) on delete cascade,family_id uuid not null references public.families(id) on delete cascade,role public.user_role not null,display_name text not null,preferred_language text not null default 'en',created_at timestamptz not null default now());
create index profiles_family_idx on public.profiles(family_id);
create table public.patients(id uuid primary key default gen_random_uuid(),family_id uuid not null references public.families(id) on delete cascade,profile_id uuid unique references public.profiles(id) on delete set null,preferred_name text not null,birth_year int,accessibility jsonb not null default '{"largeText":true,"highContrast":false,"voice":true,"reducedMotion":true}',created_at timestamptz not null default now());
create table public.memory_people(id uuid primary key default gen_random_uuid(),family_id uuid not null references public.families(id) on delete cascade,patient_id uuid not null references public.patients(id) on delete cascade,name text not null,relationship text not null,gentle_clue text not null,photo_path text,approved_by uuid not null references public.profiles(id),created_at timestamptz not null default now());
create table public.reminders(id uuid primary key default gen_random_uuid(),family_id uuid not null references public.families(id) on delete cascade,patient_id uuid not null references public.patients(id) on delete cascade,type text not null,message text not null,reminder_time time not null,enabled boolean not null default true,created_by uuid not null references public.profiles(id),created_at timestamptz not null default now());
create table public.game_sessions(id uuid primary key default gen_random_uuid(),family_id uuid not null references public.families(id) on delete cascade,patient_id uuid not null references public.patients(id) on delete cascade,game_key text not null,domain text not null,difficulty smallint not null default 1 check(difficulty between 1 and 5),accuracy smallint check(accuracy between 0 and 100),response_seconds int check(response_seconds>=0),hints_used int not null default 0,completed boolean not null default true,created_at timestamptz not null default now());
create index patients_family_idx on public.patients(family_id);create index memory_family_idx on public.memory_people(family_id,patient_id);create index reminders_family_idx on public.reminders(family_id,patient_id);create index sessions_family_idx on public.game_sessions(family_id,patient_id,created_at desc);
create or replace function public.current_family_id() returns uuid language sql stable security definer set search_path=public as $$select family_id from public.profiles where id=auth.uid()$$;
revoke all on function public.current_family_id() from public;grant execute on function public.current_family_id() to authenticated;
alter table public.families enable row level security;alter table public.profiles enable row level security;alter table public.patients enable row level security;alter table public.memory_people enable row level security;alter table public.reminders enable row level security;alter table public.game_sessions enable row level security;
create policy family_read on public.families for select to authenticated using(id=public.current_family_id());
create policy profile_read on public.profiles for select to authenticated using(family_id=public.current_family_id());
create policy patient_access on public.patients for all to authenticated using(family_id=public.current_family_id()) with check(family_id=public.current_family_id());
create policy memory_access on public.memory_people for all to authenticated using(family_id=public.current_family_id()) with check(family_id=public.current_family_id());
create policy reminder_access on public.reminders for all to authenticated using(family_id=public.current_family_id()) with check(family_id=public.current_family_id());
create policy session_access on public.game_sessions for all to authenticated using(family_id=public.current_family_id()) with check(family_id=public.current_family_id());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('memory-photos','memory-photos',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy photo_read on storage.objects for select to authenticated using(bucket_id='memory-photos' and(storage.foldername(name))[1]=public.current_family_id()::text);
create policy photo_insert on storage.objects for insert to authenticated with check(bucket_id='memory-photos' and(storage.foldername(name))[1]=public.current_family_id()::text);
create policy photo_update on storage.objects for update to authenticated using(bucket_id='memory-photos' and(storage.foldername(name))[1]=public.current_family_id()::text) with check(bucket_id='memory-photos' and(storage.foldername(name))[1]=public.current_family_id()::text);
create policy photo_delete on storage.objects for delete to authenticated using(bucket_id='memory-photos' and(storage.foldername(name))[1]=public.current_family_id()::text);

-- One-time setup for a newly authenticated caregiver. The function creates all
-- family-linked records together so a new OTP/password user is never left with
-- a partially configured account.
create or replace function public.onboard_family(p_family_name text,p_display_name text,p_patient_name text)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare new_family_id uuid; existing_family_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select family_id into existing_family_id from public.profiles where id=auth.uid();
  if existing_family_id is not null then return existing_family_id; end if;
  if length(trim(p_family_name))<2 or length(trim(p_display_name))<2 or length(trim(p_patient_name))<2 then
    raise exception 'Please enter valid names';
  end if;
  insert into public.families(name) values(trim(p_family_name)) returning id into new_family_id;
  insert into public.profiles(id,family_id,role,display_name) values(auth.uid(),new_family_id,'caregiver',trim(p_display_name));
  insert into public.patients(family_id,preferred_name) values(new_family_id,trim(p_patient_name));
  return new_family_id;
end;
$$;
revoke all on function public.onboard_family(text,text,text) from public;
grant execute on function public.onboard_family(text,text,text) to authenticated;
