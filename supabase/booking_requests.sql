create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.fleet_listings(id) on delete cascade,
  seller_profile_id uuid not null references public.seller_profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  pickup_location text not null,
  notes text,
  status text not null default 'pending' check (
    status in (
      'pending',
      'accepted',
      'rejected',
      'delivered',
      'buyer_completed',
      'completed'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

alter table public.booking_requests enable row level security;

drop trigger if exists set_booking_requests_updated_at on public.booking_requests;

create trigger set_booking_requests_updated_at
before update on public.booking_requests
for each row
execute function public.set_updated_at();

drop policy if exists "Buyers can create own booking requests" on public.booking_requests;
drop policy if exists "Buyers can view own booking requests" on public.booking_requests;
drop policy if exists "Sellers can view incoming booking requests" on public.booking_requests;
drop policy if exists "Sellers can update incoming booking requests" on public.booking_requests;

create policy "Buyers can create own booking requests"
on public.booking_requests
for insert
to authenticated
with check ((select auth.uid()) = buyer_id);

create policy "Buyers can view own booking requests"
on public.booking_requests
for select
to authenticated
using ((select auth.uid()) = buyer_id);

create policy "Sellers can view incoming booking requests"
on public.booking_requests
for select
to authenticated
using (
  seller_profile_id in (
    select id from public.seller_profiles where user_id = (select auth.uid())
  )
);

create policy "Sellers can update incoming booking requests"
on public.booking_requests
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
