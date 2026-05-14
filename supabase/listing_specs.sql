create table if not exists public.listing_vehicle_specs (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references public.fleet_listings(id) on delete cascade,
  plate_number text not null,
  make_model text not null,
  year_of_manufacture integer not null check (
    year_of_manufacture between 1950 and extract(year from now())::integer + 1
  ),
  chassis_vin text not null,
  vehicle_age integer not null check (vehicle_age >= 0),
  registration_validity date not null,
  insurance text,
  vehicle_registration_url text not null,
  number_of_trailers_trucks integer check (
    number_of_trailers_trucks is null or number_of_trailers_trucks > 0
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_driver_specs (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references public.fleet_listings(id) on delete cascade,
  driver_name text not null,
  age integer not null check (age >= 18),
  license_category text not null,
  license_number text not null,
  years_of_experience integer not null check (years_of_experience >= 0),
  similar_operations_sites text not null,
  pass_resident_card_number text not null,
  pass_resident_card_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listing_vehicle_specs enable row level security;
alter table public.listing_driver_specs enable row level security;

drop trigger if exists set_listing_vehicle_specs_updated_at on public.listing_vehicle_specs;
drop trigger if exists set_listing_driver_specs_updated_at on public.listing_driver_specs;

create trigger set_listing_vehicle_specs_updated_at
before update on public.listing_vehicle_specs
for each row
execute function public.set_updated_at();

create trigger set_listing_driver_specs_updated_at
before update on public.listing_driver_specs
for each row
execute function public.set_updated_at();

drop policy if exists "Sellers can view own vehicle specs" on public.listing_vehicle_specs;
drop policy if exists "Sellers can view own driver specs" on public.listing_driver_specs;

create policy "Sellers can view own vehicle specs"
on public.listing_vehicle_specs
for select
to authenticated
using (
  listing_id in (
    select fl.id
    from public.fleet_listings fl
    join public.seller_profiles sp on sp.id = fl.seller_profile_id
    where sp.user_id = (select auth.uid())
  )
);

create policy "Sellers can view own driver specs"
on public.listing_driver_specs
for select
to authenticated
using (
  listing_id in (
    select fl.id
    from public.fleet_listings fl
    join public.seller_profiles sp on sp.id = fl.seller_profile_id
    where sp.user_id = (select auth.uid())
  )
);

create index if not exists listing_vehicle_specs_listing_id_idx
on public.listing_vehicle_specs (listing_id);

create index if not exists listing_driver_specs_listing_id_idx
on public.listing_driver_specs (listing_id);

insert into storage.buckets (id, name, public)
values ('listing-documents', 'listing-documents', false)
on conflict (id) do update set public = false;

drop policy if exists "Authenticated users can upload listing documents" on storage.objects;
drop policy if exists "Authenticated users can view own listing documents" on storage.objects;
drop policy if exists "Authenticated users can delete own listing documents" on storage.objects;

create policy "Authenticated users can upload listing documents"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Authenticated users can view own listing documents"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'listing-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Authenticated users can delete own listing documents"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

select pg_notify('pgrst', 'reload schema');
