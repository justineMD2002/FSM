export interface User {
  id: string;
  email: string;
  created_at: string;
}

// Database Job type (matches Supabase schema)
export interface JobDB {
  id: string;
  customer_id: string;
  location_id: string | null;
  service_call_id: string | null;
  job_number: string;
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'UPCOMING' | 'OVERDUE' | 'WAITING' | 'COMPLETED' | 'CANCELLED';
  scheduled_start: string | null;
  scheduled_end: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Relations
  customer?: Customer;
  location?: Location;
}

// Location type (for job navigation - references locations table)
export interface Location {
  id: string;
  customer_id: string;
  location_name: string | null;
  current_longitude: string | null;
  current_latitude: string | null;
  destination_longitude: string | null;
  destination_latitude: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Customer Location type (for customer addresses - references customer_location table)
export interface CustomerLocation {
  id: string;
  customer_id: string;
  site_id: string | null;
  building: string | null;
  street_number: string | null;
  street: string | null;
  block: string | null;
  address: string | null;
  city: string | null;
  country_name: string | null;
  zip_code: string | null;
  address_type: string | null;
}

// UI-friendly Job type (for display in components)
export interface Job {
  id: string;
  jobName: string;
  jobCode: string;
  date: string;
  time: string;
  customer: string;
  address: string;
  notes: string;
  providerName: string;
  status: 'COMPLETED' | 'CANCELLED' | 'PENDING' | 'UPCOMING' | 'IN_PROGRESS';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  status: 'AVAILABLE' | 'ON_JOB' | 'OFFLINE';
  rating: number;
  completedJobs: number;
  avatar?: string;
}

export interface TechnicianProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  is_online: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TechnicianJob {
  id: string;
  technician_id: string;
  job_id: string;
  assignment_status: 'ASSIGNED' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
  technician_remarks: string | null;
  service_notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Relations
  technician?: TechnicianProfile;
}

export interface AttendanceRecord {
  id: string;
  technician_id: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  customer_code: string;
  customer_name: string;
  customer_address: string;
  phone_number: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}