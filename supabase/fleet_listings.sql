create table if not exists public.fleet_listings (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid not null references public.seller_profiles(id) on delete cascade,
  category text not null check (category in ('equipment', 'transport')),
  sub_type text not null,
  name text not null,
  brand text not null,
  model text not null,
  year integer not null check (year between 1950 and extract(year from now())::integer + 1),
  location_city text not null,
  daily_rate_omr numeric(12, 3) not null check (daily_rate_omr > 0),
  weekly_rate_omr numeric(12, 3) not null check (weekly_rate_omr > 0),
  monthly_rate_omr numeric(12, 3) not null check (monthly_rate_omr > 0),
  hours_used integer check (hours_used is null or hours_used >= 0),
  photos text[] not null check (
    array_length(photos, 1) between 1 and 4
  ),
  description text,
  is_active boolean not null default true,
  lift_capacity_tons numeric(12, 3),
  boom_length_meters numeric(12, 3),
  deck_length_ft numeric(12, 3),
  load_capacity_tons numeric(12, 3),
  max_height_meters numeric(12, 3),
  axle_count integer,
  additional_specs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fleet_listings enable row level security;

alter table public.fleet_listings
drop constraint if exists fleet_listings_photos_check;

alter table public.fleet_listings
add constraint fleet_listings_photos_check
check (array_length(photos, 1) between 1 and 4);

drop trigger if exists set_fleet_listings_updated_at on public.fleet_listings;

create trigger set_fleet_listings_updated_at
before update on public.fleet_listings
for each row
execute function public.set_updated_at();

drop policy if exists "Anyone can view active listings" on public.fleet_listings;
drop policy if exists "Sellers can view own listings" on public.fleet_listings;
drop policy if exists "Sellers can update own listings" on public.fleet_listings;

create policy "Anyone can view active listings"
on public.fleet_listings
for select
to anon, authenticated
using (is_active = true);

create policy "Sellers can view own listings"
on public.fleet_listings
for select
to authenticated
using (
  seller_profile_id in (
    select id from public.seller_profiles where user_id = (select auth.uid())
  )
);

create policy "Sellers can update own listings"
on public.fleet_listings
for update
to authenticated
using (
  seller_profile_id in (
    select id from public.seller_profiles where user_id = (select auth.uid())
  )
)
with check (
  seller_profile_id in (
    select id from public.seller_profiles where user_id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public)
values ('fleet-listing-photos', 'fleet-listing-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Authenticated users can upload fleet photos" on storage.objects;
drop policy if exists "Anyone can view fleet photos" on storage.objects;

create policy "Authenticated users can upload fleet photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'fleet-listing-photos');

create policy "Anyone can view fleet photos"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'fleet-listing-photos');
