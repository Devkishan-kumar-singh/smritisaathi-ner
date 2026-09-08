-- Run this once in Supabase SQL Editor for an EXISTING SmritiSaathi database.
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
