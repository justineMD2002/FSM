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