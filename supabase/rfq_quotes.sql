create table if not exists public.rfq_quotes (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfqs(id) on delete cascade,
  seller_profile_id uuid not null references public.seller_profiles(id) on delete cascade,
  price_amount numeric(12, 3) not null check (price_amount > 0),
  price_period text not null check (price_period in ('day', 'week', 'month')),
  hours_used integer not null check (hours_used >= 0),
  photos text[] not null check (array_length(photos, 1) between 1 and 4),
  notes text,
  status text not null default 'submitted' check (
    status in ('submitted', 'withdrawn', 'accepted', 'rejected')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rfq_id, seller_profile_id)
);

alter table public.rfq_quotes enable row level security;

drop trigger if exists set_rfq_quotes_updated_at on public.rfq_quotes;

create trigger set_rfq_quotes_updated_at
before update on public.rfq_quotes
for each row
execute function public.set_updated_at();

drop policy if exists "Sellers can create own RFQ quotes" on public.rfq_quotes;
drop policy if exists "Sellers can view own RFQ quotes" on public.rfq_quotes;
drop policy if exists "Buyers can view quotes for own RFQs" on public.rfq_quotes;

create policy "Sellers can create own RFQ quotes"
on public.rfq_quotes
for insert
to authenticated
with check (
  seller_profile_id in (
    select id
    from public.seller_profiles
    where user_id = (select auth.uid())
  )
);

create policy "Sellers can view own RFQ quotes"
on public.rfq_quotes
for select
to authenticated
using (
  seller_profile_id in (
    select id
    from public.seller_profiles
    where user_id = (select auth.uid())
  )
);

create policy "Buyers can view quotes for own RFQs"
on public.rfq_quotes
for select
to authenticated
using (
  rfq_id in (
    select id
    from public.rfqs
    where buyer_id = (select auth.uid())
  )
);

create index if not exists rfq_quotes_rfq_id_idx on public.rfq_quotes (rfq_id);
create index if not exists rfq_quotes_seller_profile_id_idx
on public.rfq_quotes (seller_profile_id);

insert into storage.buckets (id, name, public)
values ('rfq-quote-photos', 'rfq-quote-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Authenticated users can upload RFQ quote photos" on storage.objects;
drop policy if exists "Anyone can view RFQ quote photos" on storage.objects;
drop policy if exists "Authenticated users can delete RFQ quote photos" on storage.objects;

create policy "Authenticated users can upload RFQ quote photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'rfq-quote-photos');

create policy "Anyone can view RFQ quote photos"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'rfq-quote-photos');

create policy "Authenticated users can delete RFQ quote photos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'rfq-quote-photos');

select pg_notify('pgrst', 'reload schema');
