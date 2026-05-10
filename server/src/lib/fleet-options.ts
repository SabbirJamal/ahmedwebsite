export type FleetCategory = 'equipment' | 'transport';
export type SpecType = 'number' | 'text';

export type FleetType = {
  value: string;
  category: FleetCategory;
};

export type SpecOption = {
  key: string;
  type: SpecType;
};

export const fleetTypes: FleetType[] = [
  { value: 'crane', category: 'equipment' },
  { value: 'forklift', category: 'equipment' },
  { value: 'excavator', category: 'equipment' },
  { value: 'loader', category: 'equipment' },
  { value: 'reach_stacker', category: 'equipment' },
  { value: 'generator', category: 'equipment' },
  { value: 'boom_lift', category: 'equipment' },
  { value: 'manlift', category: 'equipment' },
  { value: 'flatbed', category: 'transport' },
  { value: 'box_trailer', category: 'transport' },
  { value: 'lowbed', category: 'transport' },
  { value: 'prime_mover', category: 'transport' },
  { value: 'recovery_truck', category: 'transport' },
  { value: 'tanker', category: 'transport' },
];

export const specOptions: Record<string, SpecOption[]> = {
  crane: [
    { key: 'lift_capacity_tons', type: 'number' },
    { key: 'boom_length_meters', type: 'number' },
    { key: 'max_radius_meters', type: 'number' },
    { key: 'max_height_meters', type: 'number' },
    { key: 'fuel_type', type: 'text' },
  ],
  forklift: [
    { key: 'lift_capacity_tons', type: 'number' },
    { key: 'max_height_meters', type: 'number' },
    { key: 'fuel_type', type: 'text' },
  ],
  excavator: [
    { key: 'operating_weight_tons', type: 'number' },
    { key: 'bucket_capacity_m3', type: 'number' },
    { key: 'max_dig_depth_meters', type: 'number' },
    { key: 'fuel_type', type: 'text' },
  ],
  loader: [
    { key: 'bucket_capacity_m3', type: 'number' },
    { key: 'operating_weight_tons', type: 'number' },
    { key: 'fuel_type', type: 'text' },
  ],
  reach_stacker: [
    { key: 'lift_capacity_tons', type: 'number' },
    { key: 'max_height_meters', type: 'number' },
    { key: 'fuel_type', type: 'text' },
  ],
  generator: [
    { key: 'power_kva', type: 'number' },
    { key: 'fuel_type', type: 'text' },
    { key: 'hours_used', type: 'number' },
  ],
  boom_lift: [
    { key: 'max_height_meters', type: 'number' },
    { key: 'outreach_meters', type: 'number' },
    { key: 'boom_length_meters', type: 'number' },
    { key: 'fuel_type', type: 'text' },
  ],
  manlift: [
    { key: 'max_height_meters', type: 'number' },
    { key: 'fuel_type', type: 'text' },
  ],
  flatbed: [
    { key: 'deck_length_ft', type: 'number' },
    { key: 'load_capacity_tons', type: 'number' },
    { key: 'axle_count', type: 'number' },
  ],
  box_trailer: [
    { key: 'deck_length_ft', type: 'number' },
    { key: 'load_capacity_tons', type: 'number' },
    { key: 'axle_count', type: 'number' },
  ],
  lowbed: [
    { key: 'deck_length_ft', type: 'number' },
    { key: 'load_capacity_tons', type: 'number' },
    { key: 'axle_count', type: 'number' },
    { key: 'neck_type', type: 'text' },
  ],
  prime_mover: [
    { key: 'horsepower', type: 'number' },
    { key: 'axle_config', type: 'text' },
    { key: 'transmission', type: 'text' },
    { key: 'load_capacity_tons', type: 'number' },
  ],
  recovery_truck: [
    { key: 'load_capacity_tons', type: 'number' },
    { key: 'bed_length_ft', type: 'number' },
    { key: 'fuel_type', type: 'text' },
  ],
  tanker: [
    { key: 'capacity_liters', type: 'number' },
    { key: 'axle_count', type: 'number' },
    { key: 'material', type: 'text' },
  ],
};

export const searchableSpecColumns = new Set([
  'lift_capacity_tons',
  'boom_length_meters',
  'deck_length_ft',
  'load_capacity_tons',
  'max_height_meters',
  'axle_count',
]);
