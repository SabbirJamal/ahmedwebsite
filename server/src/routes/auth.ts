import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

export const authRouter = Router();

const allowedCountries = new Map([
  ['Oman', '+968'],
  ['United Arab Emirates', '+971'],
  ['Saudi Arabia', '+966'],
  ['Qatar', '+974'],
  ['Bahrain', '+973'],
  ['Kuwait', '+965'],
  ['Jordan', '+962'],
  ['Lebanon', '+961'],
  ['Iraq', '+964'],
  ['Yemen', '+967'],
]);

authRouter.post('/register', async (request, response) => {
  if (!supabaseAdmin) {
    response.status(500).json({
      message: 'Supabase service role key is not configured on the server.',
    });
    return;
  }

  const {
    fullName,
    email,
    country,
    phoneCode,
    phoneNumber,
    city,
    password,
    confirmPassword,
    termsAccepted,
  } = request.body as {
    fullName?: string;
    email?: string;
    country?: string;
    phoneCode?: string;
    phoneNumber?: string;
    city?: string;
    password?: string;
    confirmPassword?: string;
    termsAccepted?: boolean;
  };

  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedCountry = country?.trim();
  const expectedPhoneCode = normalizedCountry
    ? allowedCountries.get(normalizedCountry)
    : undefined;
  const nationalPhone = phoneNumber?.replace(/\s+/g, '').trim();

  if (
    !fullName?.trim() ||
    !normalizedEmail ||
    !normalizedCountry ||
    !expectedPhoneCode ||
    phoneCode !== expectedPhoneCode ||
    !nationalPhone ||
    !city?.trim() ||
    !password ||
    !confirmPassword ||
    !termsAccepted
  ) {
    response.status(400).json({ message: 'Please fill all required fields.' });
    return;
  }

  if (password !== confirmPassword) {
    response.status(400).json({ message: 'Passwords must match.' });
    return;
  }

  const phone = `${expectedPhoneCode}${nationalPhone}`;

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim(),
        country: normalizedCountry,
        city: city.trim(),
        phone,
      },
    });

  if (authError || !authData.user) {
    response.status(400).json({
      message: authError?.message || 'Could not create account.',
    });
    return;
  }

  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: authData.user.id,
    full_name: fullName.trim(),
    email: normalizedEmail,
    phone,
    country: normalizedCountry,
    city: city.trim(),
    is_buyer: true,
    is_seller: false,
    terms_accepted_at: new Date().toISOString(),
  });

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

    response.status(400).json({
      message:
        profileError.code === '23505'
          ? 'This email or phone number is already registered.'
          : profileError.message,
    });
    return;
  }

  response.status(201).json({
    message: 'Account created successfully.',
    userId: authData.user.id,
  });
});
