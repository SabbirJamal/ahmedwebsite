import dotenv from 'dotenv';

dotenv.config();

const defaultClientOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://main.d3is95lircvzr0.amplifyapp.com',
  'https://trex-o.com',
  'https://www.trex-o.com',
];

const clientOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

export const env = {
  port: Number(process.env.PORT || 4000),
  clientOrigins: [...new Set([...defaultClientOrigins, ...clientOrigins])],
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/+$/, '');
}
