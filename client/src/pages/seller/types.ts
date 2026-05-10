import type { FleetCategory } from '../../lib/fleet-options';

export type SellerListing = {
  id: string;
  category: FleetCategory;
  sub_type: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  location_city: string;
  daily_rate_omr: number;
  weekly_rate_omr: number;
  monthly_rate_omr: number;
  photos: string[];
  is_active: boolean;
  created_at: string;
};
