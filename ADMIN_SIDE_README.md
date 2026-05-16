# Trex-O Admin Side Development Handoff

This README is a handoff document for building the Trex-O admin side in a separate folder or separate Codex chat.

## Project Overview

Trex-O is a B2B construction rental marketplace for equipment and transport.

Current stack:

- Frontend: React + Vite + TypeScript
- Backend/API: Node.js + Express + TypeScript
- Database/Auth/Storage: Supabase
- Frontend hosting: AWS Amplify
- Backend hosting: Render
- Domain: trex-o.com

Current repository structure:

```txt
Ahmed_Website/
  client/              # Main buyer/seller React frontend
  server/              # Express backend API
  supabase/            # SQL schema files
  amplify.yml          # AWS Amplify monorepo config for client
  package.json         # Workspace root
```

The admin side should be created separately, ideally as:

```txt
Ahmed_Website/
  admin/               # New admin React app
```

or, if preferred, as a completely separate repository later.

## Production URLs

Frontend:

```txt
https://trex-o.com
https://www.trex-o.com
https://main.d3is95lircvzr0.amplifyapp.com
```

Backend:

```txt
https://ahmedwebsite.onrender.com
```

Supabase project:

```txt
https://ktkfveywdccccwthuegf.supabase.co
```

## Important Security Rule

Never expose the Supabase service role key in the admin frontend.

The admin frontend should only use:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=https://ahmedwebsite.onrender.com
```

Privileged admin actions must go through the backend server using `supabaseAdmin`.

## Recommended Admin Architecture

Use this structure:

```txt
admin/
  index.html
  package.json
  vite.config.ts
  src/
    main.tsx
    App.tsx
    lib/
      supabase.ts
      api.ts
    components/
      AdminLayout.tsx
      AdminSidebar.tsx
      AdminHeader.tsx
      ProtectedAdminRoute.tsx
    pages/
      LoginPage.tsx
      DashboardPage.tsx
      UsersPage.tsx
      SellersPage.tsx
      ListingsPage.tsx
      BookingsPage.tsx
      RfqPage.tsx
      RfqQuotesPage.tsx
      NotificationsPage.tsx
      AuditLogsPage.tsx
```

Recommended admin routes:

```txt
/login
/dashboard
/users
/sellers
/listings
/bookings
/rfqs
/rfq-quotes
/notifications
/audit-logs
```

## Admin Environment Variables

For local admin development:

```env
VITE_SUPABASE_URL=https://ktkfveywdccccwthuegf.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:4000
```

For production admin deployment:

```env
VITE_SUPABASE_URL=https://ktkfveywdccccwthuegf.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=https://ahmedwebsite.onrender.com
```

Backend production environment variables on Render:

```env
PORT=4000
SUPABASE_URL=https://ktkfveywdccccwthuegf.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
CLIENT_ORIGINS=https://main.d3is95lircvzr0.amplifyapp.com,https://trex-o.com,https://www.trex-o.com
```

If admin is deployed to a separate domain, add that admin URL to `CLIENT_ORIGINS`.

Example:

```env
CLIENT_ORIGINS=https://main.d3is95lircvzr0.amplifyapp.com,https://trex-o.com,https://www.trex-o.com,https://admin.trex-o.com
```

## Existing Database Tables

### profiles

Stores normal user profile data linked to Supabase Auth.

Important columns:

```txt
id uuid primary key references auth.users(id)
full_name text not null
email text unique
phone text unique
profile_picture text
country text default 'Oman'
city text
is_buyer boolean default true
is_seller boolean default false
terms_accepted_at timestamptz
created_at timestamptz
updated_at timestamptz
```

### seller_profiles

Stores seller/company profiles.

Important columns:

```txt
id uuid primary key
user_id uuid unique references profiles(id)
company_name text not null
cr_number text unique not null
phone text not null
location_city text not null
created_at timestamptz
updated_at timestamptz
```

### fleet_listings

Stores seller equipment/transport listings.

Important columns:

```txt
id uuid primary key
seller_profile_id uuid references seller_profiles(id)
category text check ('equipment', 'transport')
sub_type text
name text not null
brand text
model text
year integer
location_city text not null
daily_rate_omr numeric not null
weekly_rate_omr numeric
monthly_rate_omr numeric
hours_used integer
photos text[]
description text
is_active boolean default true
additional_specs jsonb
created_at timestamptz
updated_at timestamptz
```

### listing_vehicle_specs

Stores vehicle/equipment specification data for listings.

Important columns:

```txt
id uuid primary key
listing_id uuid unique references fleet_listings(id)
plate_number text
make_model text
year_of_manufacture integer
chassis_vin text
vehicle_age integer
registration_validity date
insurance text
vehicle_registration_url text
number_of_trailers_trucks integer
created_at timestamptz
updated_at timestamptz
```

### listing_driver_specs

Stores driver data for listings.

Important columns:

```txt
id uuid primary key
listing_id uuid unique references fleet_listings(id)
driver_name text
age integer
license_category text
license_number text
years_of_experience integer
similar_operations_sites text
pass_resident_card_number text
pass_resident_card_url text
created_at timestamptz
updated_at timestamptz
```

### booking_requests

Stores buyer booking/order requests.

Important columns:

```txt
id uuid primary key
buyer_id uuid references profiles(id)
listing_id uuid references fleet_listings(id)
seller_profile_id uuid references seller_profiles(id)
start_date date not null
end_date date not null
pickup_location text not null
notes text
status text
created_at timestamptz
updated_at timestamptz
```

Current booking status values:

```txt
pending
accepted
rejected
delivered
buyer_completed
completed
```

### notifications

Stores user notifications.

Important columns:

```txt
id uuid primary key
user_id uuid references profiles(id)
message text not null
type text
booking_id uuid references booking_requests(id)
rfq_quote_id uuid references rfq_quotes(id)
is_read boolean default false
created_at timestamptz
```

Current notification types:

```txt
new_order
accepted
rejected
delivered
completed
cancelled
```

### rfqs

Stores buyer RFQ requests.

Important columns:

```txt
id uuid primary key
buyer_id uuid references profiles(id)
category text check ('equipment', 'transport')
sub_type text
duration_type text check ('day', 'week', 'month')
duration_value integer
customer_info jsonb
specs jsonb
additional_notes text
status text check ('open', 'closed', 'cancelled')
created_at timestamptz
updated_at timestamptz
```

### rfq_quotes

Stores seller quotations for buyer RFQs.

Important columns:

```txt
id uuid primary key
rfq_id uuid references rfqs(id)
seller_profile_id uuid references seller_profiles(id)
price_amount numeric not null
price_period text not null
hours_used integer not null
photos text[]
notes text
status text check ('submitted', 'withdrawn', 'accepted', 'rejected')
created_at timestamptz
updated_at timestamptz
```

## Recommended New Admin Tables

### admin_users

Use this table to decide who can access the admin panel.

```sql
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  role text not null check (role in ('super_admin', 'admin', 'support', 'viewer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create policy "Admins can view own admin row"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());
```

For now, insert the first admin manually from Supabase SQL editor:

```sql
insert into public.admin_users (user_id, role, is_active)
values ('USER_PROFILE_UUID_HERE', 'super_admin', true);
```

### admin_audit_logs

Use this table to track important admin actions.

```sql
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.admin_users(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;
```

Admin audit logs should usually be inserted from the backend with the service role key.

## Admin Frontend Supabase Client

Create this in:

```txt
admin/src/lib/supabase.ts
```

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase admin frontend environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Admin API Helper

Create this in:

```txt
admin/src/lib/api.ts
```

```ts
import { supabase } from './supabase';

const apiBaseUrl = import.meta.env.VITE_API_URL as string;

if (!apiBaseUrl) {
  throw new Error('Missing VITE_API_URL.');
}

export async function adminFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}
```

## Backend Admin Auth Middleware

Add this in the backend:

```txt
server/src/middleware/requireAdmin.ts
```

```ts
import type { NextFunction, Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase.js';

export type AdminRole = 'super_admin' | 'admin' | 'support' | 'viewer';

export interface AdminRequest extends Request {
  userId?: string;
  adminRole?: AdminRole;
}

export function requireAdmin(allowedRoles: AdminRole[] = ['super_admin', 'admin']) {
  return async (req: AdminRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization token.' });
      }

      const token = authHeader.replace('Bearer ', '');

      const { data: userData, error: userError } = await supabase.auth.getUser(token);

      if (userError || !userData.user) {
        return res.status(401).json({ error: 'Invalid authorization token.' });
      }

      const { data: adminUser, error: adminError } = await supabaseAdmin
        .from('admin_users')
        .select('role, is_active')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (adminError) {
        return res.status(500).json({ error: 'Unable to verify admin access.' });
      }

      if (!adminUser?.is_active || !allowedRoles.includes(adminUser.role)) {
        return res.status(403).json({ error: 'Admin access denied.' });
      }

      req.userId = userData.user.id;
      req.adminRole = adminUser.role;
      return next();
    } catch (error) {
      return res.status(500).json({ error: 'Admin authorization failed.' });
    }
  };
}
```

## Recommended Backend Admin Routes

Create:

```txt
server/src/routes/admin.ts
```

Example routes:

```ts
import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

router.use(requireAdmin());

router.get('/me', async (req, res) => {
  res.json({ ok: true });
});

router.get('/users', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ users: data });
});

router.get('/sellers', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('seller_profiles')
    .select('*, profiles(full_name, email, phone, country, city)')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ sellers: data });
});

router.get('/listings', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('fleet_listings')
    .select('*, seller_profiles(company_name, phone, location_city)')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ listings: data });
});

export default router;
```

Register the admin route in the backend app:

```ts
app.use('/api/admin', adminRoutes);
```

## Admin Permissions Recommendation

Use these roles:

```txt
super_admin
admin
support
viewer
```

Suggested permissions:

```txt
super_admin:
  - Full access
  - Manage other admins
  - Delete records

admin:
  - Manage users, sellers, listings, bookings, RFQs
  - Cannot manage super admins

support:
  - View users, sellers, bookings, RFQs
  - Update support-related statuses only

viewer:
  - Read-only access
```

## Admin Features To Build First

Start simple. Recommended first version:

1. Admin login
2. Protected admin layout
3. Dashboard metrics
4. Users table
5. Sellers table
6. Listings table
7. Booking requests table
8. RFQs table
9. RFQ quotes table
10. Notifications table

Recommended dashboard metrics:

```txt
Total users
Total buyers
Total sellers
Active listings
Inactive listings
Pending booking requests
Completed bookings
Open RFQs
Submitted RFQ quotes
```

## RLS Notes

For normal frontend apps, RLS protects user data.

For admin backend routes, use `supabaseAdmin` with the service role key. This bypasses RLS, so every admin route must verify the logged-in user with `requireAdmin`.

Do not call admin-level Supabase queries directly from the admin frontend.

## CORS Notes

The backend already supports CORS through `CLIENT_ORIGINS`.

If admin is deployed at a new URL, add it to Render:

```env
CLIENT_ORIGINS=https://main.d3is95lircvzr0.amplifyapp.com,https://trex-o.com,https://www.trex-o.com,https://admin.trex-o.com
```

Then redeploy Render.

## Admin Deployment Options

Simple options:

1. Deploy admin as a second AWS Amplify app from `admin/`
2. Deploy admin as another Vercel project from `admin/`
3. Deploy admin inside the existing frontend under `/admin`

Best recommendation for now:

Use a separate `admin/` folder and deploy it as a separate AWS Amplify app.

Reason:

- Keeps buyer/seller website clean
- Easier to secure separately
- Easier to add admin-only environment variables
- Easier to connect later to `admin.trex-o.com`

## Admin Build Commands

If using Vite:

```bash
npm install
npm run build
```

Build output:

```txt
dist
```

Admin Amplify build config if admin is in `/admin`:

```yml
version: 1
applications:
  - appRoot: admin
    frontend:
      phases:
        preBuild:
          commands:
            - npm install
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
      customRules:
        - source: </^[^.]+$|\.(?!(css|gif|ico|jpg|jpeg|js|png|txt|svg|woff|woff2|ttf|map|json|webp|mp4)$)([^.]+$)/>
          target: /index.html
          status: '200'
```

## Important Admin UI Notes

Admin UI should be functional, not marketing-style.

Use:

- Sidebar navigation
- Dense tables
- Search and filters
- Status badges
- Simple modals for edit/view actions
- Clear loading/error states

Avoid:

- Large hero sections
- Decorative landing-page layouts
- Too many animations
- Exposing service role key

## First Admin Development Checklist

1. Create `admin/` Vite React TypeScript app.
2. Add Supabase client using anon key only.
3. Add API helper using `VITE_API_URL`.
4. Create admin login page.
5. Create protected route wrapper.
6. Add `admin_users` table in Supabase.
7. Insert first `super_admin` manually.
8. Add backend `requireAdmin` middleware.
9. Add `/api/admin/*` backend routes.
10. Add admin domain to backend CORS.
11. Deploy admin frontend.
12. Test login and protected API requests.

## Key Principle

The admin frontend is only a UI.

The backend decides whether a user is really an admin.

All sensitive actions must go through:

```txt
Admin frontend -> Render backend API -> Supabase service role
```

Never:

```txt
Admin frontend -> Supabase service role
```

