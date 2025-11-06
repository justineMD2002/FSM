export interface User {
  id: string;
  email: string;
  created_at: string;
}

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
  status: 'COMPLETED' | 'CANCELLED' | 'PENDING';
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