import { Router } from 'express';
import { fleetTypes, specOptions, type FleetCategory } from '../lib/fleet-options.js';
import { supabaseAdmin } from '../lib/supabase.js';

export const rfqsRouter = Router();

type RfqSpec = {
  key?: string;
  label?: string;
  unit?: string;
  value?: string;
};

type RfqQuotePayload = {
  hoursUsed?: number;
  notes?: string;
  photos?: string[];
  priceAmount?: number;
};

type RfqQuoteAction = 'accept' | 'reject';
type RfqStatusAction = 'activate' | 'deactivate';

const commonRfqSpecKeys = new Set(['brand', 'model_number', 'year']);

async function getUserId(token?: string) {
  if (!supabaseAdmin || !token) {
    return { error: 'Please sign in first.' };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return { error: 'Your session has expired.' };
  }

  return { userId: data.user.id };
}

async function createRfqNotification(input: {
  message: string;
  quoteId: string;
  type: 'accepted' | 'rejected';
  userId: string;
}) {
  if (!supabaseAdmin) {
    return;
  }

  await supabaseAdmin.from('notifications').insert({
    booking_id: null,
    message: input.message,
    rfq_quote_id: input.quoteId,
    type: input.type,
    user_id: input.userId,
  });
}

rfqsRouter.get('/', async (request, response) => {
  if (!supabaseAdmin) {
    response.status(500).json({
      message: 'Supabase service role key is not configured on the server.',
    });
    return;
  }

  const token = request.headers.authorization?.replace('Bearer ', '');
  const { userId, error } = await getUserId(token);

  if (error || !userId) {
    response.status(401).json({ message: error });
    return;
  }

  const { data, error: rfqError } = await supabaseAdmin
    .from('rfqs')
    .select(
      'id, category, sub_type, duration_type, duration_value, specs, additional_notes, status, created_at, customer_info, rfq_quotes(id, price_amount, price_period, hours_used, photos, notes, status, created_at, seller_profiles(user_id, company_name, phone, location_city))',
    )
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false });

  if (rfqError) {
    response.status(400).json({ message: rfqError.message });
    return;
  }

  const rfqs = data || [];
  const sellerUserIds = Array.from(
    new Set(
      rfqs.flatMap((rfq) =>
        ((rfq.rfq_quotes as Array<{ seller_profiles?: { user_id?: string } }> | null) || [])
          .map((quote) => quote.seller_profiles?.user_id)
          .filter(Boolean),
      ),
    ),
  ) as string[];

  const { data: sellerProfiles } = sellerUserIds.length
    ? await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .in('id', sellerUserIds)
    : { data: [] };
  const sellerNameById = new Map(
    (sellerProfiles || []).map((profile) => [profile.id, profile.full_name]),
  );

  response.json({
    rfqs: rfqs.map((rfq) => ({
      ...rfq,
      rfq_quotes: (
        (rfq.rfq_quotes as Array<{
          seller_profiles?: { user_id?: string };
          status?: string;
        }> | null) || []
      )
        .filter((quote) => quote.status !== 'rejected')
        .map((quote) => ({
          ...quote,
          seller_name: quote.seller_profiles?.user_id
            ? sellerNameById.get(quote.seller_profiles.user_id) || null
            : null,
        })),
    })),
  });
});

rfqsRouter.get('/open', async (request, response) => {
  if (!supabaseAdmin) {
    response.status(500).json({
      message: 'Supabase service role key is not configured on the server.',
    });
    return;
  }

  const token = request.headers.authorization?.replace('Bearer ', '');
  const { userId, error } = await getUserId(token);

  if (error || !userId) {
    response.status(401).json({ message: error });
    return;
  }

  const { data: sellerProfile, error: sellerError } = await supabaseAdmin
    .from('seller_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (sellerError || !sellerProfile) {
    response.status(403).json({ message: 'Please create a seller profile first.' });
    return;
  }

  const { data, error: rfqError } = await supabaseAdmin
    .from('rfqs')
    .select(
      'id, category, sub_type, duration_type, duration_value, specs, additional_notes, status, created_at, customer_info',
    )
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (rfqError) {
    response.status(400).json({ message: rfqError.message });
    return;
  }

  const rfqs = data || [];
  const rfqIds = rfqs.map((rfq) => rfq.id);

  const { data: sellerQuotes, error: quotesError } = rfqIds.length
    ? await supabaseAdmin
        .from('rfq_quotes')
        .select('id, rfq_id, status')
        .eq('seller_profile_id', sellerProfile.id)
        .in('rfq_id', rfqIds)
    : { data: [], error: null };

  if (quotesError) {
    response.status(400).json({ message: quotesError.message });
    return;
  }

  const quoteByRfqId = new Map(
    (sellerQuotes || []).map((quote) => [quote.rfq_id, quote]),
  );

  response.json({
    rfqs: rfqs.map((rfq) => ({
      ...rfq,
      seller_quote: quoteByRfqId.get(rfq.id) || null,
    })),
  });
});

rfqsRouter.post('/', async (request, response) => {
  if (!supabaseAdmin) {
    response.status(500).json({
      message: 'Supabase service role key is not configured on the server.',
    });
    return;
  }

  const token = request.headers.authorization?.replace('Bearer ', '');
  const { userId, error } = await getUserId(token);

  if (error || !userId) {
    response.status(401).json({ message: error });
    return;
  }

  const {
    category,
    subType,
    specs,
    additionalNotes,
    customerInfo,
    durationType,
    durationValue,
    requestInfo,
    routeInfo,
  } = request.body as {
    additionalNotes?: string;
    category?: FleetCategory;
    customerInfo?: {
      companyName?: string;
      contactPerson?: string;
      country?: string;
      email?: string;
      mobileNumber?: string;
      vatNumber?: string;
    };
    durationType?: string;
    durationValue?: number;
    requestInfo?: {
      numberOfTrips?: number;
      numberOfUnits?: number;
    };
    routeInfo?: {
      country?: string;
      from?: string;
      to?: string;
    };
    specs?: RfqSpec[];
    subType?: string;
  };

  const itemType = fleetTypes.find((item) => item.value === subType);

  if (!itemType || itemType.category !== category) {
    response.status(400).json({ message: 'Please choose a valid item type.' });
    return;
  }

  if (
    !customerInfo?.contactPerson?.trim() ||
    !customerInfo.mobileNumber?.trim() ||
    !customerInfo.email?.trim() ||
    !customerInfo.country?.trim()
  ) {
    response.status(400).json({
      message: 'Please fill the required customer information.',
    });
    return;
  }

  const requestedDurationValue = Number(durationValue);

  if (
    !durationType ||
    !['day', 'week', 'month'].includes(durationType) ||
    !Number.isInteger(requestedDurationValue) ||
    requestedDurationValue < 1
  ) {
    response.status(400).json({ message: 'Please select a valid time period.' });
    return;
  }

  const numberOfTrips = Number(requestInfo?.numberOfTrips);
  const numberOfUnits = Number(requestInfo?.numberOfUnits);

  if (
    !Number.isInteger(numberOfTrips) ||
    numberOfTrips < 1 ||
    !Number.isInteger(numberOfUnits) ||
    numberOfUnits < 1 ||
    !routeInfo?.country?.trim() ||
    !routeInfo.from?.trim() ||
    !routeInfo.to?.trim()
  ) {
    response.status(400).json({
      message: 'Please fill the trips, quantity, and destination details.',
    });
    return;
  }

  const allowedSpecs = specOptions[itemType.value] || [];
  const allowedSpecKeys = new Set([
    ...allowedSpecs.map((spec) => spec.key),
    ...commonRfqSpecKeys,
  ]);
  const cleanSpecs = Array.isArray(specs)
    ? specs
        .filter((spec) => spec.key && allowedSpecKeys.has(spec.key) && spec.value?.trim())
        .map((spec) => ({
          key: spec.key,
          label: spec.label || spec.key,
          unit: spec.unit || '',
          value: spec.value?.trim(),
        }))
    : [];

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('full_name, email, phone, country')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    response.status(404).json({ message: 'Buyer profile was not found.' });
    return;
  }

  const customerSnapshot = {
    companyName: customerInfo?.companyName?.trim() || null,
    contactPerson: customerInfo?.contactPerson?.trim() || profile.full_name,
    country: customerInfo?.country?.trim() || profile.country,
    email: customerInfo?.email?.trim() || profile.email,
    mobileNumber: customerInfo?.mobileNumber?.trim() || profile.phone,
    requestInfo: {
      numberOfTrips,
      numberOfUnits,
    },
    routeInfo: {
      country: routeInfo.country.trim(),
      from: routeInfo.from.trim(),
      to: routeInfo.to.trim(),
    },
    vatNumber: customerInfo?.vatNumber?.trim() || null,
  };

  const { data: rfq, error: insertError } = await supabaseAdmin
    .from('rfqs')
    .insert({
      buyer_id: userId,
      category,
      duration_type: durationType,
      duration_value: requestedDurationValue,
      sub_type: itemType.value,
      specs: cleanSpecs,
      additional_notes: additionalNotes?.trim() || null,
      customer_info: customerSnapshot,
      status: 'open',
    })
    .select('id')
    .single();

  if (insertError || !rfq) {
    response.status(400).json({
      message: insertError?.message || 'Could not create RFQ.',
    });
    return;
  }

  response.status(201).json({ rfqId: rfq.id });
});

rfqsRouter.patch('/:id/status', async (request, response) => {
  if (!supabaseAdmin) {
    response.status(500).json({
      message: 'Supabase service role key is not configured on the server.',
    });
    return;
  }

  const token = request.headers.authorization?.replace('Bearer ', '');
  const { userId, error } = await getUserId(token);

  if (error || !userId) {
    response.status(401).json({ message: error });
    return;
  }

  const { action } = request.body as { action?: RfqStatusAction };

  if (!action || !['activate', 'deactivate'].includes(action)) {
    response.status(400).json({ message: 'Please choose a valid status.' });
    return;
  }

  const nextStatus = action === 'activate' ? 'open' : 'cancelled';
  const { data: rfq, error: updateError } = await supabaseAdmin
    .from('rfqs')
    .update({ status: nextStatus })
    .eq('id', request.params.id)
    .eq('buyer_id', userId)
    .select('id, status')
    .single();

  if (updateError || !rfq) {
    response.status(400).json({
      message: updateError?.message || 'Could not update RFQ status.',
    });
    return;
  }

  response.json({ rfq });
});

rfqsRouter.post('/:id/quotes', async (request, response) => {
  if (!supabaseAdmin) {
    response.status(500).json({
      message: 'Supabase service role key is not configured on the server.',
    });
    return;
  }

  const token = request.headers.authorization?.replace('Bearer ', '');
  const { userId, error } = await getUserId(token);

  if (error || !userId) {
    response.status(401).json({ message: error });
    return;
  }

  const { data: sellerProfile, error: sellerError } = await supabaseAdmin
    .from('seller_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (sellerError || !sellerProfile) {
    response.status(403).json({ message: 'Please create a seller profile first.' });
    return;
  }

  const { data: rfq, error: rfqError } = await supabaseAdmin
    .from('rfqs')
    .select('id, duration_type, status')
    .eq('id', request.params.id)
    .maybeSingle();

  if (rfqError || !rfq) {
    response.status(404).json({ message: 'RFQ was not found.' });
    return;
  }

  if (rfq.status !== 'open') {
    response.status(400).json({ message: 'This RFQ is no longer open.' });
    return;
  }

  const { hoursUsed, notes, photos, priceAmount } = request.body as RfqQuotePayload;
  const cleanPhotos = Array.isArray(photos)
    ? photos.filter((photo) => typeof photo === 'string' && photo.trim())
    : [];
  const requestedPrice = Number(priceAmount);
  const requestedHours = Number(hoursUsed);

  if (!Number.isFinite(requestedPrice) || requestedPrice <= 0) {
    response.status(400).json({ message: 'Please enter a valid price.' });
    return;
  }

  if (!Number.isInteger(requestedHours) || requestedHours < 0) {
    response.status(400).json({ message: 'Please enter valid hours used.' });
    return;
  }

  if (cleanPhotos.length < 1 || cleanPhotos.length > 4) {
    response.status(400).json({ message: 'Please upload between 1 and 4 photos.' });
    return;
  }

  const { data: quote, error: insertError } = await supabaseAdmin
    .from('rfq_quotes')
    .insert({
      rfq_id: rfq.id,
      seller_profile_id: sellerProfile.id,
      price_amount: requestedPrice,
      price_period: rfq.duration_type,
      hours_used: requestedHours,
      photos: cleanPhotos,
      notes: notes?.trim() || null,
      status: 'submitted',
    })
    .select('id')
    .single();

  if (insertError || !quote) {
    const message = insertError?.code === '23505'
      ? 'You have already sent an offer for this RFQ.'
      : insertError?.message || 'Could not send offer.';

    response.status(400).json({ message });
    return;
  }

  response.status(201).json({ quoteId: quote.id });
});

rfqsRouter.patch('/quotes/:id/status', async (request, response) => {
  if (!supabaseAdmin) {
    response.status(500).json({
      message: 'Supabase service role key is not configured on the server.',
    });
    return;
  }

  const token = request.headers.authorization?.replace('Bearer ', '');
  const { userId, error } = await getUserId(token);

  if (error || !userId) {
    response.status(401).json({ message: error });
    return;
  }

  const { action } = request.body as { action?: RfqQuoteAction };

  if (!action || !['accept', 'reject'].includes(action)) {
    response.status(400).json({ message: 'Please choose a valid action.' });
    return;
  }

  const { data: quote, error: quoteError } = await supabaseAdmin
    .from('rfq_quotes')
    .select(
      'id, status, seller_profiles(user_id, company_name), rfqs(buyer_id, sub_type)',
    )
    .eq('id', request.params.id)
    .maybeSingle();

  if (quoteError || !quote) {
    response.status(404).json({ message: 'Offer was not found.' });
    return;
  }

  const rfq = quote.rfqs as { buyer_id?: string; sub_type?: string } | null;
  const sellerProfile = quote.seller_profiles as {
    company_name?: string;
    user_id?: string;
  } | null;

  if (rfq?.buyer_id !== userId) {
    response.status(403).json({ message: 'You cannot update this offer.' });
    return;
  }

  if (quote.status !== 'submitted') {
    response.status(400).json({ message: 'This offer has already been updated.' });
    return;
  }

  const nextStatus = action === 'accept' ? 'accepted' : 'rejected';
  const { data: updatedQuote, error: updateError } = await supabaseAdmin
    .from('rfq_quotes')
    .update({ status: nextStatus })
    .eq('id', quote.id)
    .select('id, status')
    .single();

  if (updateError || !updatedQuote) {
    response.status(400).json({
      message: updateError?.message || 'Could not update offer.',
    });
    return;
  }

  if (sellerProfile?.user_id) {
    const { data: buyerProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();
    const itemLabel = rfq?.sub_type
      ? rfq.sub_type.replace(/_/g, ' ')
      : 'this item';

    await createRfqNotification({
      quoteId: quote.id,
      type: nextStatus,
      userId: sellerProfile.user_id,
      message:
        nextStatus === 'accepted'
          ? `Your offer for ${itemLabel} by ${buyerProfile?.full_name || 'the buyer'} has been accepted.`
          : `Your offer for ${itemLabel} by ${buyerProfile?.full_name || 'the buyer'} has been rejected.`,
    });
  }

  response.json({ quote: updatedQuote });
});
