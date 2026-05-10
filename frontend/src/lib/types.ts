export type UserRole = 'citizen' | 'driver' | 'admin';
export type PickupStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type WasteType = 'wet' | 'dry' | 'e-waste' | 'bulky';
export type ComplaintStatus = 'open' | 'in_review' | 'resolved' | 'rejected';
export type DriverAvailability = 'available' | 'on_route' | 'off_duty' | 'suspended';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface User {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  address: string;
  verified: boolean;
  household_id: string | null;
  electricity_bill_path: string | null;
  driver_id: number | null;
  vehicle_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Pickup {
  id: number;
  user_id: number;
  driver_id: number | null;
  waste_type: WasteType;
  status: PickupStatus;
  scheduled_date: string;
  scheduled_time: string;
  coordinates: Coordinates | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Complaint {
  id: number;
  user_id: number;
  category: string;
  description: string;
  image: string | null;
  status: ComplaintStatus;
  created_at: string;
  updated_at: string;
}

export interface Reward {
  id: number;
  user_id: number;
  points: number;
  source: string;
  redeemed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: number;
  user_id: number;
  vehicle_number: string;
  availability: DriverAvailability;
}

export interface DriverLocation {
  id: number;
  driver_id: number;
  pickup_id: number;
  latitude: number;
  longitude: number;
  status: PickupStatus;
  note: string | null;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsMetric {
  label: string;
  value: number;
}

export interface WasteDistributionPoint {
  waste_type: string;
  requests: number;
}

export interface AnalyticsSummary {
  waste_distribution: WasteDistributionPoint[];
  pickup_efficiency: AnalyticsMetric;
  area_wise_pickups: AnalyticsMetric[];
  complaint_trends: AnalyticsMetric[];
  recycling_participation: AnalyticsMetric;
}

export interface OTPResponse {
  phone: string;
  expires_in_seconds: number;
  delivery_channel: string;
  message: string;
}

export interface UploadResponse {
  file_name: string;
  stored_path: string;
  public_url: string;
}
