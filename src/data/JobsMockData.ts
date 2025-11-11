import { Job } from "@/types";

export const mockHistoryJobs: Job[] = [
  {
    id: '1',
    jobName: 'HVAC Maintenance',
    jobCode: 'JOB-001',
    date: '2025-10-28',
    time: '09:00 AM',
    customer: 'PANASONIC ASIA PACIFIC PTE LTD',
    customerId: 'mock-customer-1',
    address: 'Panasonic Service Center, North Reclamation Area, Cebu City, Cebu, Philippines',
    notes: 'Regular maintenance check',
    providerName: 'John Doe',
    status: 'COMPLETED',
    locationName: null,
    locationAddress: null
  },
  {
    id: '2',
    jobName: 'Electrical Repair',
    jobCode: 'JOB-002',
    date: '2025-10-27',
    time: '02:00 PM',
    customer: 'Building B',
    customerId: 'mock-customer-2',
    address: 'IT Park, Lahug, Cebu City, Cebu, Philippines',
    notes: 'Fix lighting issue in lobby',
    providerName: 'Jane Smith',
    status: 'CANCELLED',
    locationName: null,
    locationAddress: null
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
    customerId: 'mock-customer-3',
    address: '426 Cebu South Coastal Road, South Road Properties, Cebu City 6000, Cebu, Philippines',
    notes: 'Check pressure levels',
    providerName: 'Sarah Connor',
    status: 'PENDING',
    locationName: null,
    locationAddress: null
  },
  {
    id: '5',
    jobName: 'Air Conditioning Service',
    jobCode: 'JOB-005',
    date: '2025-10-30',
    time: '09:00 AM',
    customer: 'PANASONIC ASIA PACIFIC PTE LTD',
    customerId: 'mock-customer-1',
    address: 'Panasonic Building, C.D. Seno St., Tipolo, Mandaue City (near Cebu City), Cebu, Philippines',
    notes: 'Quarterly AC maintenance',
    providerName: 'John Doe',
    status: 'PENDING',
    locationName: null,
    locationAddress: null
  },
  {
    id: '6',
    jobName: 'Generator Maintenance',
    jobCode: 'JOB-006',
    date: '2025-10-30',
    time: '10:30 AM',
    customer: 'Building B',
    customerId: 'mock-customer-2',
    address: '429 Asiatown IT Park, Lahug, Cebu City 6000, Cebu, Philippines',
    notes: 'Monthly generator check',
    providerName: 'Jane Smith',
    status: 'PENDING',
    locationName: null,
    locationAddress: null
  },
  {
    id: '7',
    jobName: 'Fire Alarm System Test',
    jobCode: 'JOB-007',
    date: '2025-10-30',
    time: '03:00 PM',
    customer: 'SM Seaside Complex',
    customerId: 'mock-customer-4',
    address: '426 Cebu South Coastal Road, SM Seaside City Cebu, South Road Properties, Cebu City 6000, Cebu, Philippines',
    notes: 'Annual fire safety inspection',
    providerName: 'Mike Johnson',
    status: 'PENDING',
    locationName: null,
    locationAddress: null
  },
  {
    id: '8',
    jobName: 'Plumbing Repair',
    jobCode: 'JOB-008',
    date: '2025-10-31',
    time: '08:00 AM',
    customer: 'PANASONIC ASIA PACIFIC PTE LTD',
    customerId: 'mock-customer-1',
    address: 'Panasonic Building, C.D. Seno St., Tipolo, Mandaue City, Cebu, Philippines',
    notes: 'Fix water leak in basement',
    providerName: 'Sarah Connor',
    status: 'PENDING',
    locationName: null,
    locationAddress: null
  },
  {
    id: '9',
    jobName: 'Security System Update',
    jobCode: 'JOB-009',
    date: '2025-10-31',
    time: '11:00 AM',
    customer: 'IT Park Building',
    customerId: 'mock-customer-5',
    address: 'G/F Teleperformance Tower (beside Skyrise 2), I Villa St., Brgy. Apas, Cebu IT Park, Cebu City 6000, Cebu, Philippines',
    notes: 'Install new cameras',
    providerName: 'John Doe',
    status: 'PENDING',
    locationName: null,
    locationAddress: null
  }
];