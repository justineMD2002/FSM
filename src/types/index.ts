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
  buildingName: string;
  address: string;
  notes: string;
  providerName: string;
  status: 'COMPLETED' | 'CANCELLED' | 'ONGOING';
}