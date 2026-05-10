import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  response.json({
    ok: true,
    service: 'Ahmed Construction B2B API',
    supabaseConfigured: Boolean(supabase),
  });
});
