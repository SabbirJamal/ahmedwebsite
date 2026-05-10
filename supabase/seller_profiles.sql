create table if not exists public.seller_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  company_name text not null,
  cr_number text not null unique,
  phone text not null,
  location_city text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.seller_profiles enable row level security;

drop trigger if exists set_seller_profiles_updated_at on public.seller_profiles;

create trigger set_seller_profiles_updated_at
before update on public.seller_profiles
for each row
execute function public.set_updated_at();

drop policy if exists "Users can view own seller profile" on public.seller_profiles;
drop policy if exists "Users can update own seller profile" on public.seller_profiles;

create policy "Users can view own seller profile"
on public.seller_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can update own seller profile"
on public.seller_profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
