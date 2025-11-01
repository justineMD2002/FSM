import { Job } from "@/types";

export const mockHistoryJobs: Job[] = [
  {
    id: '1',
    jobName: 'HVAC Maintenance',
    jobCode: 'JOB-001',
    date: '2025-10-28',
    time: '09:00 AM',
    customer: 'PANASONIC ASIA PACIFIC PTE LTD',
    address: 'Panasonic Service Center, North Reclamation Area, Cebu City, Cebu, Philippines',
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
    address: 'IT Park, Lahug, Cebu City, Cebu, Philippines',
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
    address: 'SM Seaside City Cebu, South Road Properties, Cebu City, Cebu, Philippines',
    notes: 'Check pressure levels',
    providerName: 'Sarah Connor',
    status: 'PENDING'
  }
];