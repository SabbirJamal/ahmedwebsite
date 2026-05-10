import { Router } from 'express';
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

  if (!token) {
    response.status(401).json({ message: 'Please sign in first.' });
    return;
  }

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.getUser(token);

  if (userError || !userData.user) {
    response.status(401).json({ message: 'Your session has expired.' });
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

  const userId = userData.user.id;
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, is_seller')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    response.status(404).json({ message: 'Buyer profile was not found.' });
    return;
  }

  if (profile.is_seller) {
    response.status(400).json({ message: 'Seller profile already exists.' });
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

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ is_seller: true })
    .eq('id', userId);

  if (updateError) {
    await supabaseAdmin
      .from('seller_profiles')
      .delete()
      .eq('id', sellerProfile.id);

    response.status(400).json({
      message: updateError.message,
    });
    return;
  }

  response.status(201).json({
    message: 'Seller profile created successfully.',
    sellerProfileId: sellerProfile.id,
  });
});
