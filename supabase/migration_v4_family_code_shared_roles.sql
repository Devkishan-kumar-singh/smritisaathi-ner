-- Run this once in the EXISTING Supabase project for SmritiSaathi v4.
alter table public.families add column if not exists family_code text;
update public.families
set family_code=upper(substr(regexp_replace(name,'[^A-Za-z0-9]','','g'),1,8))||'-'||upper(substr(replace(id::text,'-',''),1,6))
where family_code is null;
alter table public.families alter column family_code set not null;
create unique index if not exists families_family_code_unique on public.families(family_code);

create or replace function public.onboard_family(p_family_name text,p_display_name text,p_patient_name text)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare new_family_id uuid; existing_family_id uuid; new_family_code text; code_base text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select family_id into existing_family_id from public.profiles where id=auth.uid();
  if existing_family_id is not null then return existing_family_id; end if;
  if length(trim(p_family_name))<2 or length(trim(p_display_name))<2 or length(trim(p_patient_name))<2 then
    raise exception 'Please enter valid names';
  end if;
  code_base:=upper(substr(regexp_replace(trim(p_family_name),'[^A-Za-z0-9]','','g'),1,8));
  if code_base='' then code_base:='FAMILY'; end if;
  new_family_code:=code_base||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into public.families(name,family_code) values(trim(p_family_name),new_family_code) returning id into new_family_id;
  insert into public.profiles(id,family_id,role,display_name) values(auth.uid(),new_family_id,'caregiver',trim(p_display_name));
  insert into public.patients(family_id,preferred_name) values(new_family_id,trim(p_patient_name));
  return new_family_id;
end;
$$;
revoke all on function public.onboard_family(text,text,text) from public;
grant execute on function public.onboard_family(text,text,text) to authenticated;
