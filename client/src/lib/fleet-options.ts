export type FleetCategory = 'equipment' | 'transport';
export type SpecType = 'number' | 'text';

export type FleetType = {
  value: string;
  label: string;
  category: FleetCategory;
};

export type SpecOption = {
  key: string;
  label: string;
  unit: string;
  type: SpecType;
};

export const fleetTypes: FleetType[] = [
  { value: 'crane', label: 'Cranes (50T, 75T, 200T)', category: 'equipment' },
  { value: 'forklift', label: 'Forklift', category: 'equipment' },
  { value: 'excavator', label: 'Excavator', category: 'equipment' },
  { value: 'loader', label: 'Loader', category: 'equipment' },
  { value: 'reach_stacker', label: 'Reach Stacker', category: 'equipment' },
  { value: 'generator', label: 'Generator', category: 'equipment' },
  { value: 'boom_lift', label: 'Boom Lift', category: 'equipment' },
  { value: 'manlift', label: 'Manlift', category: 'equipment' },
  { value: 'flatbed', label: 'Flatbed Trailer', category: 'transport' },
  { value: 'box_trailer', label: 'Box/Container Trailer', category: 'transport' },
  { value: 'lowbed', label: 'Lowbed', category: 'transport' },
  { value: 'prime_mover', label: 'Prime Mover', category: 'transport' },
  { value: 'recovery_truck', label: 'Recovery Truck', category: 'transport' },
  { value: 'tanker', label: 'Tanker', category: 'transport' },
];

export const specOptions: Record<string, SpecOption[]> = {
  crane: [
    { key: 'lift_capacity_tons', label: 'Lift Capacity', unit: 'tons', type: 'number' },
    { key: 'boom_length_meters', label: 'Boom Length', unit: 'meters', type: 'number' },
    { key: 'max_radius_meters', label: 'Max Radius', unit: 'meters', type: 'number' },
    { key: 'max_height_meters', label: 'Max Height', unit: 'meters', type: 'number' },
    { key: 'fuel_type', label: 'Fuel Type', unit: '', type: 'text' },
  ],
  forklift: [
    { key: 'lift_capacity_tons', label: 'Lift Capacity', unit: 'tons', type: 'number' },
    { key: 'max_height_meters', label: 'Mast Height', unit: 'meters', type: 'number' },
    { key: 'fuel_type', label: 'Fuel Type', unit: '', type: 'text' },
  ],
  excavator: [
    { key: 'operating_weight_tons', label: 'Operating Weight', unit: 'tons', type: 'number' },
    { key: 'bucket_capacity_m3', label: 'Bucket Capacity', unit: 'm3', type: 'number' },
    { key: 'max_dig_depth_meters', label: 'Max Dig Depth', unit: 'meters', type: 'number' },
    { key: 'fuel_type', label: 'Fuel Type', unit: '', type: 'text' },
  ],
  loader: [
    { key: 'bucket_capacity_m3', label: 'Bucket Capacity', unit: 'm3', type: 'number' },
    { key: 'operating_weight_tons', label: 'Operating Weight', unit: 'tons', type: 'number' },
    { key: 'fuel_type', label: 'Fuel Type', unit: '', type: 'text' },
  ],
  reach_stacker: [
    { key: 'lift_capacity_tons', label: 'Lift Capacity', unit: 'tons', type: 'number' },
    { key: 'max_height_meters', label: 'Max Height', unit: 'meters', type: 'number' },
    { key: 'fuel_type', label: 'Fuel Type', unit: '', type: 'text' },
  ],
  generator: [
    { key: 'power_kva', label: 'Power Output', unit: 'kVA', type: 'number' },
    { key: 'fuel_type', label: 'Fuel Type', unit: '', type: 'text' },
    { key: 'hours_used', label: 'Hours Used', unit: '', type: 'number' },
  ],
  boom_lift: [
    { key: 'max_height_meters', label: 'Platform Height', unit: 'meters', type: 'number' },
    { key: 'outreach_meters', label: 'Outreach', unit: 'meters', type: 'number' },
    { key: 'boom_length_meters', label: 'Boom Length', unit: 'meters', type: 'number' },
    { key: 'fuel_type', label: 'Fuel Type', unit: '', type: 'text' },
  ],
  manlift: [
    { key: 'max_height_meters', label: 'Platform Height', unit: 'meters', type: 'number' },
    { key: 'fuel_type', label: 'Fuel Type', unit: '', type: 'text' },
  ],
  flatbed: [
    { key: 'deck_length_ft', label: 'Deck Length', unit: 'ft', type: 'number' },
    { key: 'load_capacity_tons', label: 'Load Capacity', unit: 'tons', type: 'number' },
    { key: 'axle_count', label: 'Axle Count', unit: '', type: 'number' },
  ],
  box_trailer: [
    { key: 'deck_length_ft', label: 'Trailer Length', unit: 'ft', type: 'number' },
    { key: 'load_capacity_tons', label: 'Load Capacity', unit: 'tons', type: 'number' },
    { key: 'axle_count', label: 'Axle Count', unit: '', type: 'number' },
  ],
  lowbed: [
    { key: 'deck_length_ft', label: 'Deck Length', unit: 'ft', type: 'number' },
    { key: 'load_capacity_tons', label: 'Load Capacity', unit: 'tons', type: 'number' },
    { key: 'axle_count', label: 'Axle Count', unit: '', type: 'number' },
    { key: 'neck_type', label: 'Neck Type', unit: '', type: 'text' },
  ],
  prime_mover: [
    { key: 'horsepower', label: 'Horsepower', unit: 'HP', type: 'number' },
    { key: 'axle_config', label: 'Axle Configuration', unit: '', type: 'text' },
    { key: 'transmission', label: 'Transmission', unit: '', type: 'text' },
    { key: 'load_capacity_tons', label: 'Towing Capacity', unit: 'tons', type: 'number' },
  ],
  recovery_truck: [
    { key: 'load_capacity_tons', label: 'Towing Capacity', unit: 'tons', type: 'number' },
    { key: 'bed_length_ft', label: 'Bed Length', unit: 'ft', type: 'number' },
    { key: 'fuel_type', label: 'Fuel Type', unit: '', type: 'text' },
  ],
  tanker: [
    { key: 'capacity_liters', label: 'Tank Capacity', unit: 'liters', type: 'number' },
    { key: 'axle_count', label: 'Axle Count', unit: '', type: 'number' },
    { key: 'material', label: 'Material', unit: '', type: 'text' },
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
