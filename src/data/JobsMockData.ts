import { Job } from "@/types";

export const mockHistoryJobs: Job[] = [
  {
    id: '1',
    jobName: 'HVAC Maintenance',
    jobCode: 'JOB-001',
    date: '2025-10-28',
    time: '09:00 AM',
    customer: 'PANASONIC ASIA PACIFIC PTE LTD',
    address: '123 Main St, City, State 12345',
    notes: 'Regular maintenance check',
    providerName: 'John Doe',
    status: 'COMPLETED'
  },
  {
    id: '2',
    jobName: 'Electrical Repair',
    jobCode: 'JOB-002',
    date: '2025-10-27',
    time: '02:00 PM',
    customer: 'Building B',
    address: '456 Oak Ave, City, State 12345',
    notes: 'Fix lighting issue in lobby',
    providerName: 'Jane Smith',
    status: 'CANCELLED'
  }
];

export const mockCurrentJobs: Job[] = [
  {
    id: '4',
    jobName: 'Boiler Inspection',
    jobCode: 'JOB-004',
    date: '2025-10-30',
    time: '01:00 PM',
    customer: 'Building D',
    address: '222 Elm St, City, State 12345',
    notes: 'Check pressure levels',
    providerName: 'Sarah Connor',
    status: 'PENDING'
  }
];
