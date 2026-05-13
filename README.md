# Trex-O

A fresh TypeScript React + Node website for a B2B construction marketplace.

## Stack

- React + TypeScript + Vite frontend
- Node + Express + TypeScript backend
- Supabase database/client

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment examples:

   ```bash
   copy client\.env.example client\.env
   copy server\.env.example server\.env
   ```

3. Add your Supabase project URL and keys to both `.env` files.

4. Run the app:

   ```bash
   npm run dev
   ```

The frontend runs on `http://localhost:5173` and proxies API calls to the backend on `http://localhost:4000`.

## Environment Setup

### Local frontend: `client/.env`

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
VITE_API_URL=http://localhost:4000
```

### Local backend: `server/.env`

```env
PORT=4000
CLIENT_ORIGINS=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_secret_service_role_key
```

### AWS Amplify frontend environment variables

Set these in **AWS Amplify > App settings > Environment variables**:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
VITE_API_URL=https://ahmedwebsite.onrender.com
```

Do not use `http://localhost:4000` in production. The browser runs on the user's device, so `localhost` would point to the user's computer, not your backend.

### Render backend environment variables

Set these in **Render > Service > Environment**:

```env
PORT=4000
CLIENT_ORIGINS=https://main.d3is95lircvzr0.amplifyapp.com,https://trex-o.com,https://www.trex-o.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_secret_service_role_key
```

`CLIENT_ORIGINS` is comma-separated so local, Vercel preview, and custom domains can be allowed without code changes.

## Production Notes

- Frontend-only Vercel deploys cannot serve the Express API in `server/`.
- The frontend calls API routes through `VITE_API_URL`.
- In local development, `VITE_API_URL=http://localhost:4000`.
- In production, `VITE_API_URL` must be the public HTTPS URL of the deployed backend.
- AWS Amplify SPA routing is handled by `client/amplify.yml`, which rewrites frontend routes to `index.html`.

## Supabase Setup

1. Create a Supabase project.
2. In Supabase, open **SQL Editor** and run the SQL from `supabase/profiles.sql`.
3. In the same SQL Editor, run the SQL from `supabase/seller_profiles.sql`.
4. In the same SQL Editor, run the SQL from `supabase/fleet_listings.sql`.
5. Open **Authentication > Providers > Email** and turn off email confirmation for now.
6. Open **Project Settings > API** and copy:
   - Project URL
   - anon/public key
   - service_role key
7. Add the Project URL and anon key to `client/.env`.
8. Add the Project URL, anon key, and service role key to `server/.env`.

The register form creates a Supabase Auth user first, then inserts a matching `profiles` row with `is_buyer = true` and `is_seller = false`.
The seller form inserts a `seller_profiles` row and then updates `profiles.is_seller = true`.
The add-item form uploads photos to the public `fleet-listing-photos` storage bucket and inserts the listing into `fleet_listings`.
