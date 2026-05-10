import { createClient } from '@supabase/supabase-js';
import type { WebSocketLikeConstructor } from '@supabase/realtime-js';
import WebSocket from 'ws';
import { env } from '../config/env.js';

const serverKey = env.supabaseServiceRoleKey || env.supabaseAnonKey;
const serverOptions = {
  realtime: {
    transport: WebSocket as unknown as WebSocketLikeConstructor,
  },
};

export const supabase =
  env.supabaseUrl && serverKey
    ? createClient(env.supabaseUrl, serverKey, serverOptions)
    : null;

export const supabaseAdmin =
  env.supabaseUrl && env.supabaseServiceRoleKey
    ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
        ...serverOptions,
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;
