import { Router } from 'express';
import {
  fleetTypes,
  searchableSpecColumns,
  specOptions,
  type FleetCategory,
} from '../lib/fleet-options.js';
import { getActiveProfile } from '../lib/account-access.js';
import { supabaseAdmin } from '../lib/supabase.js';

export const fleetRouter = Router();

type ListingPayload = {
  category?: FleetCategory;
  subType?: string;
  name?: string;
  brand?: string;
  model?: string;
  year?: number;
  locationCity?: string;
  dailyRateOmr?: number;
  weeklyRateOmr?: number;
  monthlyRateOmr?: number;
  hoursUsed?: number | null;
  photos?: string[];
  description?: string;
  isActive?: boolean;
  specs?: Record<string, string | number>;
  driverSpec?: {
    age?: number;
    driverName?: string;
    licenseCategory?: string;
    licenseNumber?: string;
    passResidentCardNumber?: string;
    passResidentCardUrl?: string;
    similarOperationsSites?: string;
    yearsOfExperience?: number;
  };
  vehicleSpec?: {
    chassisVin?: string;
    insurance?: string;
    makeModel?: string;
    numberOfTrailersTrucks?: number | null;
    plateNumber?: string;
    registrationValidity?: string;
    vehicleAge?: number;
    vehicleRegistrationUrl?: string;
    yearOfManufacture?: number;
  };
};

fleetRouter.get('/listings', async (request, response) => {
  if (!supabaseAdmin) {
    response.status(500).json({
      message: 'Supabase service role key is not configured on the server.',
    });
    return;
  }

  let query = supabaseAdmin
    .from('fleet_listings')
    .select(
      'id, seller_profile_id, category, sub_type, name, brand, model, year, location_city, daily_rate_omr, photos, is_active, created_at, seller_profiles(company_name)',
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const category = String(request.query.category || '');
  const type = String(request.query.type || '');

  if (category === 'equipment' || category === 'transport') {
    query = query.eq('category', category);
  }

  if (type) {
    query = query.eq('sub_type', type);
  }

  const { data, error } = await query;

  if (error) {
    response.status(400).json({ message: error.message });
    return;
  }

  response.json({ listings: data || [] });
});

async function getSellerProfileId(token?: string) {
  if (!supabaseAdmin) {
    return {
      error: 'Supabase service role key is not configured on the server.',
      statusCode: 500,
    };
  }

  const { profile, userId, error, statusCode } = await getActiveProfile(token);

  if (error || !profile || !userId) {
    return { error, statusCode };
  }

  if (!profile.is_seller) {
    return {
      error: 'Your seller application is waiting for admin approval.',
      statusCode: 403,
    };
  }

  const { data: sellerProfile, error: sellerError } = await supabaseAdmin
    .from('seller_profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (sellerError || !sellerProfile) {
    return { error: 'Please create a seller profile first.' };
  }

  return { sellerProfileId: sellerProfile.id, userId };
}

fleetRouter.get('/listings/mine', async (request, response) => {
  if (!supabaseAdmin) {
    response.status(500).json({
      message: 'Supabase service role key is not configured on the server.',
    });
    return;
  }

  const token = request.headers.authorization?.replace('Bearer ', '');
  const { sellerProfileId, error, statusCode } = await getSellerProfileId(token);

  if (error || !sellerProfileId) {
    response.status(statusCode || 403).json({
      message: error,
    });
    return;
  }

  const { data, error: listingsError } = await supabaseAdmin
    .from('fleet_listings')
    .select(
      'id, category, sub_type, name, brand, model, year, location_city, daily_rate_omr, weekly_rate_omr, monthly_rate_omr, photos, is_active, created_at',
    )
    .eq('seller_profile_id', sellerProfileId)
    .order('created_at', { ascending: false });

  if (listingsError) {
    response.status(400).json({ message: listingsError.message });
    return;
  }

  response.json({ listings: data || [] });
});

fleetRouter.get('/listings/:id', async (request, response) => {
  if (!supabaseAdmin) {
    response.status(500).json({
      message: 'Supabase service role key is not configured on the server.',
    });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('fleet_listings')
    .select(
      '*, seller_profiles(company_name, phone, location_city, profiles(full_name, country, city))',
    )
    .eq('id', request.params.id)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    response.status(404).json({
      message: 'Listing was not found.',
    });
    return;
  }

  response.json({ listing: data });
});

fleetRouter.patch('/listings/:id/status', async (request, response) => {
  if (!supabaseAdmin) {
    response.status(500).json({
      message: 'Supabase service role key is not configured on the server.',
    });
    return;
  }

  const token = request.headers.authorization?.replace('Bearer ', '');
  const { sellerProfileId, error, statusCode } = await getSellerProfileId(token);

  if (error || !sellerProfileId) {
    response.status(statusCode || 403).json({
      message: error,
    });
    return;
  }

  const { isActive } = request.body as { isActive?: boolean };

  if (typeof isActive !== 'boolean') {
    response.status(400).json({ message: 'Please choose a valid status.' });
    return;
  }

  const { data, error: updateError } = await supabaseAdmin
    .from('fleet_listings')
    .update({ is_active: isActive })
    .eq('id', request.params.id)
    .eq('seller_profile_id', sellerProfileId)
    .select('id, is_active')
    .single();

  if (updateError || !data) {
    response.status(400).json({
      message: updateError?.message || 'Could not update listing status.',
    });
    return;
  }

  response.json({ listing: data });
});

fleetRouter.post('/listings', async (request, response) => {
  if (!supabaseAdmin) {
    response.status(500).json({
      message: 'Supabase service role key is not configured on the server.',
    });
    return;
  }

  const token = request.headers.authorization?.replace('Bearer ', '');
  const { sellerProfileId, userId, error, statusCode } =
    await getSellerProfileId(token);

  if (error || !sellerProfileId || !userId) {
    response.status(statusCode || 403).json({ message: error });
    return;
  }

  const payload = request.body as ListingPayload;
  const itemType = fleetTypes.find((item) => item.value === payload.subType);

  if (!itemType || itemType.category !== payload.category) {
    response.status(400).json({ message: 'Please choose a valid item type.' });
    return;
  }

  const subType = itemType.value;

  if (
    !payload.name?.trim() ||
    !payload.brand?.trim() ||
    !payload.model?.trim() ||
    !payload.year ||
    !payload.locationCity?.trim() ||
    !payload.dailyRateOmr ||
    !payload.weeklyRateOmr ||
    !payload.monthlyRateOmr
  ) {
    response.status(400).json({ message: 'Please fill all required fields.' });
    return;
  }

  const photos = Array.isArray(payload.photos)
    ? payload.photos.filter((photo) => typeof photo === 'string' && photo.trim())
    : [];

  if (photos.length < 1 || photos.length > 4) {
    response.status(400).json({
      message: `Please upload between 1 and 4 photos. Received ${photos.length}.`,
    });
    return;
  }

  const currentYear = new Date().getFullYear();

  if (payload.year < 1950 || payload.year > currentYear + 1) {
    response.status(400).json({ message: 'Please enter a valid year.' });
    return;
  }

  const vehicleSpec = payload.vehicleSpec;
  const driverSpec = payload.driverSpec;

  if (
    !vehicleSpec?.plateNumber?.trim() ||
    !vehicleSpec.makeModel?.trim() ||
    !vehicleSpec.chassisVin?.trim() ||
    !vehicleSpec.registrationValidity ||
    !vehicleSpec.vehicleRegistrationUrl?.trim() ||
    !vehicleSpec.yearOfManufacture ||
    vehicleSpec.vehicleAge === undefined
  ) {
    response.status(400).json({ message: 'Please fill all vehicle specifications.' });
    return;
  }

  if (
    vehicleSpec.yearOfManufacture < 1950 ||
    vehicleSpec.yearOfManufacture > currentYear + 1 ||
    vehicleSpec.vehicleAge < 0
  ) {
    response.status(400).json({ message: 'Please enter valid vehicle details.' });
    return;
  }

  if (
    payload.category === 'transport' &&
    (!vehicleSpec.numberOfTrailersTrucks || vehicleSpec.numberOfTrailersTrucks < 1)
  ) {
    response.status(400).json({
      message: 'Please enter the number of trailers/trucks.',
    });
    return;
  }

  if (
    !driverSpec?.driverName?.trim() ||
    !driverSpec.licenseCategory?.trim() ||
    !driverSpec.licenseNumber?.trim() ||
    !driverSpec.passResidentCardNumber?.trim() ||
    !driverSpec.passResidentCardUrl?.trim() ||
    !driverSpec.similarOperationsSites?.trim() ||
    !driverSpec.age ||
    driverSpec.yearsOfExperience === undefined
  ) {
    response.status(400).json({ message: 'Please fill all driver specifications.' });
    return;
  }

  if (driverSpec.age < 18 || driverSpec.yearsOfExperience < 0) {
    response.status(400).json({ message: 'Please enter valid driver details.' });
    return;
  }

  const expectedSpecs = specOptions[subType] || [];
  const submittedSpecs = payload.specs || {};
  const listingSpecs: Record<string, number | string> = {};

  for (const spec of expectedSpecs) {
    const value = submittedSpecs[spec.key];

    if (value === undefined || value === '') {
      response.status(400).json({ message: 'Please fill all item specifications.' });
      return;
    }

    listingSpecs[spec.key] = spec.type === 'number' ? Number(value) : String(value);

    if (spec.type === 'number' && Number.isNaN(listingSpecs[spec.key])) {
      response.status(400).json({ message: 'Please enter valid specification values.' });
      return;
    }
  }

  const searchableSpecs: Record<string, number> = {};
  const additionalSpecs: Record<string, number | string> = {};

  Object.entries(listingSpecs).forEach(([key, value]) => {
    if (searchableSpecColumns.has(key) && typeof value === 'number') {
      searchableSpecs[key] = value;
      return;
    }

    additionalSpecs[key] = value;
  });

  const { data: listing, error: listingError } = await supabaseAdmin
    .from('fleet_listings')
    .insert({
      seller_profile_id: sellerProfileId,
      category: payload.category,
      sub_type: subType,
      name: payload.name.trim(),
      brand: payload.brand.trim(),
      model: payload.model.trim(),
      year: payload.year,
      location_city: payload.locationCity.trim(),
      daily_rate_omr: payload.dailyRateOmr,
      weekly_rate_omr: payload.weeklyRateOmr,
      monthly_rate_omr: payload.monthlyRateOmr,
      hours_used: payload.hoursUsed ?? null,
      photos,
      description: payload.description?.trim() || null,
      is_active: payload.isActive ?? true,
      additional_specs: additionalSpecs,
      ...searchableSpecs,
    })
    .select('id')
    .single();

  if (listingError || !listing) {
    response.status(400).json({
      message: listingError?.message || 'Could not create listing.',
    });
    return;
  }

  const { error: vehicleSpecError } = await supabaseAdmin
    .from('listing_vehicle_specs')
    .insert({
      listing_id: listing.id,
      plate_number: vehicleSpec.plateNumber.trim(),
      make_model: vehicleSpec.makeModel.trim(),
      year_of_manufacture: vehicleSpec.yearOfManufacture,
      chassis_vin: vehicleSpec.chassisVin.trim(),
      vehicle_age: vehicleSpec.vehicleAge,
      registration_validity: vehicleSpec.registrationValidity,
      insurance: vehicleSpec.insurance?.trim() || null,
      vehicle_registration_url: vehicleSpec.vehicleRegistrationUrl.trim(),
      number_of_trailers_trucks:
        payload.category === 'transport'
          ? vehicleSpec.numberOfTrailersTrucks
          : null,
    });

  if (vehicleSpecError) {
    await supabaseAdmin.from('fleet_listings').delete().eq('id', listing.id);
    response.status(400).json({
      message: vehicleSpecError.message || 'Could not save vehicle specifications.',
    });
    return;
  }

  const { error: driverSpecError } = await supabaseAdmin
    .from('listing_driver_specs')
    .insert({
      listing_id: listing.id,
      driver_name: driverSpec.driverName.trim(),
      age: driverSpec.age,
      license_category: driverSpec.licenseCategory.trim(),
      license_number: driverSpec.licenseNumber.trim(),
      years_of_experience: driverSpec.yearsOfExperience,
      similar_operations_sites: driverSpec.similarOperationsSites.trim(),
      pass_resident_card_number: driverSpec.passResidentCardNumber.trim(),
      pass_resident_card_url: driverSpec.passResidentCardUrl.trim(),
    });

  if (driverSpecError) {
    await supabaseAdmin.from('fleet_listings').delete().eq('id', listing.id);
    response.status(400).json({
      message: driverSpecError.message || 'Could not save driver specifications.',
    });
    return;
  }

  response.status(201).json({
    message: 'Listing created successfully.',
    listingId: listing.id,
  });
});
