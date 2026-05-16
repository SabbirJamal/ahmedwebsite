import { Router } from 'express';
import { getActiveProfile, getAuthenticatedProfile } from '../lib/account-access.js';
import { supabaseAdmin } from '../lib/supabase.js';

export const bookingsRouter = Router();

type BookingStatus =
  | 'active'
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'delivered'
  | 'buyer_completed'
  | 'completed';

type BookingAction = 'accept' | 'reject' | 'delivered' | 'buyer_completed' | 'completed';

async function getUserId(token?: string) {
  return getAuthenticatedProfile(token);
}

async function getApprovedSellerProfileId(userId: string) {
  if (!supabaseAdmin) {
    return { error: 'Supabase service role key is not configured on the server.' };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('is_seller, status')
    .eq('id', userId)
    .single<{ is_seller: boolean; status: string | null }>();

  if (profileError || (profile?.status || 'active') !== 'active' || !profile?.is_seller) {
    return { sellerProfileId: null };
  }

  const { data: sellerProfile, error: sellerError } = await supabaseAdmin
    .from('seller_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (sellerError || !sellerProfile) {
    return { sellerProfileId: null };
  }

  return { sellerProfileId: sellerProfile.id };
}

async function createNotification(input: {
  userId: string;
  bookingId: string;
  message: string;
  type:
    | 'new_order'
    | 'accepted'
    | 'rejected'
    | 'delivered'
    | 'completed'
    | 'cancelled';
}) {
  if (!supabaseAdmin) {
    return;
  }

  await supabaseAdmin.from('notifications').insert({
    user_id: input.userId,
    booking_id: input.bookingId,
    message: input.message,
    type: input.type,
  });
}

bookingsRouter.post('/', async (request, response) => {
  if (!supabaseAdmin) {
    response.status(500).json({
      message: 'Supabase service role key is not configured on the server.',
    });
    return;
  }

  const token = request.headers.authorization?.replace('Bearer ', '');
  const { userId, error, statusCode } = await getActiveProfile(token);

  if (error || !userId) {
    response.status(statusCode || 403).json({ message: error });
    return;
  }

  const { listingId, startDate, endDate, pickupLocation, notes } = request.body as {
    listingId?: string;
    startDate?: string;
    endDate?: string;
    pickupLocation?: string;
    notes?: string;
  };

  if (!listingId || !startDate || !endDate || !pickupLocation?.trim()) {
    response.status(400).json({ message: 'Please fill all required fields.' });
    return;
  }

  const { data: buyerProfile } = await supabaseAdmin
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single();

  const { data: listing, error: listingError } = await supabaseAdmin
    .from('fleet_listings')
    .select('id, name, seller_profile_id, seller_profiles(user_id)')
    .eq('id', listingId)
    .eq('is_active', true)
    .single();

  if (listingError || !listing) {
    response.status(404).json({ message: 'Listing was not found.' });
    return;
  }

  const sellerProfile = listing.seller_profiles as { user_id?: string } | null;

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('booking_requests')
    .insert({
      buyer_id: userId,
      listing_id: listing.id,
      seller_profile_id: listing.seller_profile_id,
      start_date: startDate,
      end_date: endDate,
      pickup_location: pickupLocation.trim(),
      notes: notes?.trim() || null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (bookingError || !booking) {
    response.status(400).json({
      message: bookingError?.message || 'Could not send request.',
    });
    return;
  }

  if (sellerProfile?.user_id) {
    await createNotification({
      userId: sellerProfile.user_id,
      bookingId: booking.id,
      message: `${buyerProfile?.full_name || 'A buyer'} placed a new order for ${listing.name}`,
      type: 'new_order',
    });
  }

  response.status(201).json({ bookingId: booking.id });
});

bookingsRouter.get('/orders', async (request, response) => {
  if (!supabaseAdmin) {
    response.status(500).json({
      message: 'Supabase service role key is not configured on the server.',
    });
    return;
  }

  const token = request.headers.authorization?.replace('Bearer ', '');
  const { userId, error, statusCode } = await getActiveProfile(token);

  if (error || !userId) {
    response.status(statusCode || 403).json({ message: error });
    return;
  }

  const { sellerProfileId } = await getApprovedSellerProfileId(userId);

  const { data: myOrders, error: myOrdersError } = await supabaseAdmin
    .from('booking_requests')
    .select(
      'id, start_date, end_date, pickup_location, notes, status, created_at, fleet_listings(name, photos, brand, model), seller_profiles(company_name, phone, location_city)',
    )
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false });

  if (myOrdersError) {
    response.status(400).json({ message: myOrdersError.message });
    return;
  }

  let incomingOrders: unknown[] = [];

  if (sellerProfileId) {
    const { data, error: incomingError } = await supabaseAdmin
      .from('booking_requests')
      .select(
        'id, start_date, end_date, pickup_location, notes, status, created_at, fleet_listings(name, photos, brand, model), profiles!booking_requests_buyer_id_fkey(full_name, phone)',
      )
      .eq('seller_profile_id', sellerProfileId)
      .order('created_at', { ascending: false });

    if (incomingError) {
      response.status(400).json({ message: incomingError.message });
      return;
    }

    incomingOrders = data || [];
  }

  const { data: notifications, error: notificationsError } = await supabaseAdmin
    .from('notifications')
    .select('id, message, type, booking_id, rfq_quote_id, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(12);

  const isNotificationsTableMissing =
    notificationsError?.message?.includes("Could not find the table") ||
    notificationsError?.code === 'PGRST205';

  if (notificationsError && !isNotificationsTableMissing) {
    response.status(400).json({ message: notificationsError.message });
    return;
  }

  response.json({
    incomingOrders,
    myOrders: myOrders || [],
    notifications: isNotificationsTableMissing ? [] : notifications || [],
  });
});

bookingsRouter.get('/notifications/count', async (request, response) => {
  if (!supabaseAdmin) {
    response.status(500).json({
      message: 'Supabase service role key is not configured on the server.',
    });
    return;
  }

  const token = request.headers.authorization?.replace('Bearer ', '');
  const { userId, error, statusCode } = await getActiveProfile(token);

  if (error || !userId) {
    response.status(statusCode || 403).json({ message: error });
    return;
  }

  const { count } = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  response.json({ count: count || 0 });
});

bookingsRouter.get('/notifications', async (request, response) => {
  if (!supabaseAdmin) {
    response.status(500).json({
      message: 'Supabase service role key is not configured on the server.',
    });
    return;
  }

  const token = request.headers.authorization?.replace('Bearer ', '');
  const { userId, error, statusCode } = await getUserId(token);

  if (error || !userId) {
    response.status(statusCode || 401).json({ message: error });
    return;
  }

  const { data, error: notificationsError } = await supabaseAdmin
    .from('notifications')
    .select('id, message, type, booking_id, rfq_quote_id, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(8);

  const isNotificationsTableMissing =
    notificationsError?.message?.includes("Could not find the table") ||
    notificationsError?.code === 'PGRST205';

  if (notificationsError && !isNotificationsTableMissing) {
    response.status(400).json({ message: notificationsError.message });
    return;
  }

  response.json({ notifications: isNotificationsTableMissing ? [] : data || [] });
});

bookingsRouter.patch('/notifications/:id/read', async (request, response) => {
  if (!supabaseAdmin) {
    response.status(500).json({
      message: 'Supabase service role key is not configured on the server.',
    });
    return;
  }

  const token = request.headers.authorization?.replace('Bearer ', '');
  const { userId, error, statusCode } = await getActiveProfile(token);

  if (error || !userId) {
    response.status(statusCode || 403).json({ message: error });
    return;
  }

  await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', request.params.id)
    .eq('user_id', userId);

  response.json({ ok: true });
});

bookingsRouter.patch('/:id/status', async (request, response) => {
  if (!supabaseAdmin) {
    response.status(500).json({
      message: 'Supabase service role key is not configured on the server.',
    });
    return;
  }

  const token = request.headers.authorization?.replace('Bearer ', '');
  const { userId, error, statusCode } = await getActiveProfile(token);

  if (error || !userId) {
    response.status(statusCode || 403).json({ message: error });
    return;
  }

  const { action } = request.body as { action?: BookingAction };

  if (
    !action ||
    !['accept', 'reject', 'delivered', 'buyer_completed', 'completed'].includes(action)
  ) {
    response.status(400).json({ message: 'Please choose a valid action.' });
    return;
  }

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('booking_requests')
    .select(
      'id, buyer_id, seller_profile_id, status, pickup_location, fleet_listings(name), seller_profiles(user_id, company_name), profiles!booking_requests_buyer_id_fkey(full_name)',
    )
    .eq('id', request.params.id)
    .single();

  if (bookingError || !booking) {
    response.status(404).json({ message: 'Order was not found.' });
    return;
  }

  const sellerProfile = booking.seller_profiles as {
    user_id?: string;
    company_name?: string;
  } | null;
  const listing = booking.fleet_listings as { name?: string } | null;
  const buyerProfile = booking.profiles as { full_name?: string } | null;
  const currentStatus = booking.status as BookingStatus;
  const isSeller = sellerProfile?.user_id === userId;
  const isBuyer = booking.buyer_id === userId;

  if (isSeller) {
    const { sellerProfileId } = await getApprovedSellerProfileId(userId);

    if (!sellerProfileId) {
      response.status(403).json({
        message: 'Your seller application is waiting for admin approval.',
      });
      return;
    }
  }

  let nextStatus: BookingStatus | null = null;
  let notification:
    | {
        userId: string;
        message: string;
        type:
          | 'accepted'
          | 'rejected'
          | 'delivered'
          | 'completed'
          | 'cancelled';
      }
    | null = null;

  if (
    isSeller &&
    (currentStatus === 'pending' || currentStatus === 'active') &&
    action === 'accept'
  ) {
    nextStatus = 'accepted';
    notification = {
      userId: booking.buyer_id,
      message: `${sellerProfile?.company_name || 'The seller'} accepted your order for ${listing?.name || 'the item'}`,
      type: 'accepted',
    };
  }

  if (
    isSeller &&
    (currentStatus === 'pending' || currentStatus === 'active') &&
    action === 'reject'
  ) {
    nextStatus = 'rejected';
    notification = {
      userId: booking.buyer_id,
      message: `${sellerProfile?.company_name || 'The seller'} rejected your order for ${listing?.name || 'the item'}`,
      type: 'rejected',
    };
  }

  if (isSeller && currentStatus === 'accepted' && action === 'delivered') {
    nextStatus = 'delivered';
    notification = {
      userId: booking.buyer_id,
      message: `${sellerProfile?.company_name || 'The seller'} delivered ${listing?.name || 'the item'} to ${booking.pickup_location}`,
      type: 'delivered',
    };
  }

  if (isBuyer && currentStatus === 'delivered' && action === 'buyer_completed') {
    nextStatus = 'buyer_completed';
    if (sellerProfile?.user_id) {
      notification = {
        userId: sellerProfile.user_id,
        message: `${buyerProfile?.full_name || 'The buyer'} has completed and returned ${listing?.name || 'the item'}`,
        type: 'completed',
      };
    }
  }

  if (isSeller && currentStatus === 'buyer_completed' && action === 'completed') {
    nextStatus = 'completed';
  }

  if (!nextStatus) {
    response.status(403).json({ message: 'This order cannot be updated from here.' });
    return;
  }

  const { data: updatedBooking, error: updateError } = await supabaseAdmin
    .from('booking_requests')
    .update({ status: nextStatus })
    .eq('id', booking.id)
    .select('id, status')
    .single();

  if (updateError || !updatedBooking) {
    response.status(400).json({
      message: updateError?.message || 'Could not update order.',
    });
    return;
  }

  if (notification) {
    await createNotification({
      bookingId: booking.id,
      userId: notification.userId,
      message: notification.message,
      type: notification.type,
    });
  }

  response.json({ order: updatedBooking });
});

bookingsRouter.get('/seller-orders', async (request, response) => {
  response.redirect(307, '/api/bookings/orders');
});
