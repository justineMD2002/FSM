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
  endDate?: string;
  endTime?: string;
  customer: string;
  customerId: string; // Add customer ID for lookups
  address: string;
  locationName: string | null;
  notes: string;
  providerName: string;
  status: 'COMPLETED' | 'CANCELLED' | 'PENDING' | 'UPCOMING' | 'IN_PROGRESS';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  technicianAssignmentStatus?: 'ASSIGNED' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
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
  is_service_report_submitted: boolean | null;
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
  is_break: boolean | null;
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

// Equipment types
export interface Equipment {
  id: string;
  customer_id: string;
  item_code: string;
  serial_number: string | null;
  model_series: string | null;
  item_group: string | null;
  brand: string | null;
  item_name: string;
  equipment_location: string | null;
  warranty_start_date: string | null;
  warranty_end_date: string | null;
  equipment_type: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Job Equipment (junction table)
export interface JobEquipment {
  id: string;
  job_id: string;
  equipment_id: string;
  quantity_used: number;
  notes: string | null;
  created_at: string;
  // Relations
  equipment?: Equipment;
}

// Job Task types
export interface JobTask {
  id: string;
  job_id: string;
  task_name: string;
  task_description: string | null;
  task_order: number;
  is_required: boolean;
  is_completed: boolean;
}

// Task Completion types
export interface TaskCompletion {
  id: string;
  technician_job_id: string;
  job_task_id: string;
  is_completed: boolean;
  completion_notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  job_task?: JobTask;
}

// Follow-up types
export interface Followup {
  id: string;
  job_id: string;
  user_id: string;
  technician_id: string | null;
  type: string | null;
  status: string | null;
  priority: string | null;
  notes: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Relations
  technician?: TechnicianProfile;
}

// Job Signature types
export interface JobSignature {
  id: string;
  technician_job_id: string;
  signature_image_url: string;
  customer_name: string;
  customer_feedback: string | null;
  signed_at: string;
  created_at: string;
}

// Contact types (for customer contact persons)
export interface Contact {
  id: string;
  customer_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  tel1: string | null;
  tel2: string | null;
  email: string | null;
}

// Job Image types (supports both images and videos)
export interface JobImage {
  id: string;
  job_id: string;
  technician_job_id: string | null;
  image_url: string; // URL for both images and videos
  description: string | null;
  media_type: 'IMAGE' | 'VIDEO' | null; // Type of media
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Job Technician Admin Message types
export interface JobTechnicianAdminMessage {
  id: string;
  job_id: string;
  technician_job_id: string;
  sender_type: 'TECHNICIAN' | 'ADMIN';
  message_text: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
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