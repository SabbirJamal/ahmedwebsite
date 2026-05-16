import { Router } from 'express';
import { getActiveProfile } from '../lib/account-access.js';
import { supabaseAdmin } from '../lib/supabase.js';

export const sellersRouter = Router();

sellersRouter.post('/profile', async (request, response) => {
  if (!supabaseAdmin) {
    response.status(500).json({
      message: 'Supabase service role key is not configured on the server.',
    });
    return;
  }

  const token = request.headers.authorization?.replace('Bearer ', '');
  const { profile, userId, error, statusCode } = await getActiveProfile(token);

  if (error || !profile || !userId) {
    response.status(statusCode || 403).json({ message: error });
    return;
  }

  const { companyName, crNumber, phone, locationCity } =
    request.body as {
      companyName?: string;
      crNumber?: string;
      phone?: string;
      locationCity?: string;
    };

  if (
    !companyName?.trim() ||
    !crNumber?.trim() ||
    !phone?.trim() ||
    !locationCity?.trim()
  ) {
    response.status(400).json({ message: 'Please fill all required fields.' });
    return;
  }

  if (profile.is_seller) {
    response.status(400).json({ message: 'Seller profile already exists.' });
    return;
  }

  const { data: existingApplication, error: existingApplicationError } =
    await supabaseAdmin
      .from('seller_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

  if (existingApplicationError) {
    response.status(400).json({
      message: existingApplicationError.message,
    });
    return;
  }

  if (existingApplication) {
    response.status(409).json({
      message: 'Your seller application is waiting for admin approval.',
      sellerProfileId: existingApplication.id,
    });
    return;
  }

  const { data: sellerProfile, error: sellerError } = await supabaseAdmin
    .from('seller_profiles')
    .insert({
      user_id: userId,
      company_name: companyName.trim(),
      cr_number: crNumber.trim(),
      phone: phone.trim(),
      location_city: locationCity.trim(),
    })
    .select('id')
    .single();

  if (sellerError || !sellerProfile) {
    response.status(400).json({
      message:
        sellerError?.code === '23505'
          ? 'This CR number is already registered.'
          : sellerError?.message || 'Could not create seller profile.',
    });
    return;
  }

  response.status(201).json({
    message: 'Seller application submitted for admin approval.',
    sellerProfileId: sellerProfile.id,
  });
});
