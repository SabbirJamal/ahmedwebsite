import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  response.json({
    ok: true,
    service: 'Trex-O API',
    supabaseConfigured: Boolean(supabase),
  });
});
