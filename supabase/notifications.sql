create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  type text not null check (
    type in (
      'new_order',
      'accepted',
      'rejected',
      'delivered',
      'completed',
      'cancelled'
    )
  ),
  booking_id uuid references public.booking_requests(id) on delete cascade,
  rfq_quote_id uuid references public.rfq_quotes(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;

create policy "Users can view own notifications"
on public.notifications
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can update own notifications"
on public.notifications
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

alter table public.notifications
alter column booking_id drop not null;

alter table public.notifications
add column if not exists rfq_quote_id uuid references public.rfq_quotes(id) on delete cascade;

select pg_notify('pgrst', 'reload schema');
