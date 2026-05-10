create table if not exists public.rfqs (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('equipment', 'transport')),
  sub_type text not null,
  duration_type text not null check (duration_type in ('day', 'week', 'month')),
  duration_value integer not null check (duration_value > 0),
  customer_info jsonb not null default '{}'::jsonb,
  specs jsonb not null default '[]'::jsonb,
  additional_notes text,
  status text not null default 'open' check (status in ('open', 'closed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rfqs enable row level security;

drop trigger if exists set_rfqs_updated_at on public.rfqs;

create trigger set_rfqs_updated_at
before update on public.rfqs
for each row
execute function public.set_updated_at();

drop policy if exists "Buyers can create own RFQs" on public.rfqs;
drop policy if exists "Buyers can view own RFQs" on public.rfqs;
drop policy if exists "Buyers can update own RFQs" on public.rfqs;
drop policy if exists "Sellers can view open RFQs" on public.rfqs;

create policy "Buyers can create own RFQs"
on public.rfqs
for insert
to authenticated
with check ((select auth.uid()) = buyer_id);

create policy "Buyers can view own RFQs"
on public.rfqs
for select
to authenticated
using ((select auth.uid()) = buyer_id);

create policy "Buyers can update own RFQs"
on public.rfqs
for update
to authenticated
using ((select auth.uid()) = buyer_id)
with check ((select auth.uid()) = buyer_id);

create policy "Sellers can view open RFQs"
on public.rfqs
for select
to authenticated
using (
  status = 'open'
  and exists (
    select 1 from public.seller_profiles where user_id = (select auth.uid())
  )
);

create index if not exists rfqs_buyer_id_idx on public.rfqs (buyer_id);
create index if not exists rfqs_status_created_at_idx on public.rfqs (status, created_at desc);
create index if not exists rfqs_category_sub_type_idx on public.rfqs (category, sub_type);
