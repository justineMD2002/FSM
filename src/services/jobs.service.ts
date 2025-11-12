import { supabase } from '@/lib/supabase';
import { JobDB, Job, ApiResponse } from '@/types';

/**
 * Jobs Service
 * Handles all job-related database operations
 */

const TABLE_NAME = 'jobs';

/**
 * Transform database job to UI-friendly job format
 */
export const transformJobToUI = (dbJob: JobDB): Job => {
  // Parse scheduled_start to get date and time
  const scheduledDate = dbJob.scheduled_start ? new Date(dbJob.scheduled_start) : new Date();
  const date = scheduledDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = scheduledDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Map status to UI status (COMPLETED, CANCELLED, PENDING, UPCOMING, IN_PROGRESS)
  let uiStatus: 'COMPLETED' | 'CANCELLED' | 'PENDING' | 'UPCOMING' | 'IN_PROGRESS' = 'PENDING';

  if (dbJob.status === 'COMPLETED') {
    uiStatus = 'COMPLETED';
  } else if (dbJob.status === 'CANCELLED') {
    uiStatus = 'CANCELLED';
  } else if (dbJob.status === 'IN_PROGRESS') {
    uiStatus = 'IN_PROGRESS';
  } else if (dbJob.status === 'UPCOMING') {
    uiStatus = 'UPCOMING';
  } else {
    // PENDING, OVERDUE, WAITING all map to PENDING in UI
    uiStatus = 'PENDING';
  }

  return {
    id: dbJob.id,
    jobName: dbJob.title,
    jobCode: dbJob.job_number,
    date,
    time,
    customer: dbJob.customer?.customer_name || 'Unknown Customer',
    customerId: dbJob.customer_id,
    // Use location_name if available, otherwise fall back to customer address
    address: dbJob.location?.location_name || dbJob.customer?.customer_address || 'No address provided',
    locationName: dbJob.location?.location_name || null,
    notes: dbJob.description || '',
    // TODO: Get technician name from technician_jobs table
    // Need to add a join to technician_jobs -> technicians to get full_name
    // For now, using a placeholder value
    providerName: 'Technician',
    status: uiStatus,
    priority: dbJob.priority,
  };
};

/**
 * Fetch all jobs from the database with customer and location details
 * @param statusFilter - Optional array of statuses to filter by
 * @returns ApiResponse with array of jobs in UI format
 */
export const getAllJobs = async (
  statusFilter?: string[]
): Promise<ApiResponse<Job[]>> => {
  try {
    let query = supabase
      .from(TABLE_NAME)
      .select(`
        *,
        customer:customer_id (
          id,
          customer_code,
          customer_name,
          customer_address,
          phone_number,
          email
        ),
        location:location_id (
          id,
          customer_id,
          location_name,
          current_longitude,
          current_latitude,
          destination_longitude,
          destination_latitude
        )
      `)
      .order('scheduled_start', { ascending: false });

    // Apply status filter if provided
    if (statusFilter && statusFilter.length > 0) {
      query = query.in('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      };
    }

    // Transform database jobs to UI format
    const transformedJobs = (data as JobDB[]).map(transformJobToUI);

    return {
      data: transformedJobs,
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'An unexpected error occurred',
        details: error,
      },
    };
  }
};

/**
 * Fetch jobs by status (for History vs Current tabs)
 * @param isHistory - true for COMPLETED/CANCELLED jobs, false for PENDING/UPCOMING/IN_PROGRESS
 * @returns ApiResponse with array of jobs in UI format
 */
export const getJobsByType = async (
  isHistory: boolean
): Promise<ApiResponse<Job[]>> => {
  const statusFilter = isHistory
    ? ['COMPLETED', 'CANCELLED']
    : ['PENDING', 'UPCOMING', 'IN_PROGRESS', 'OVERDUE', 'WAITING'];

  return getAllJobs(statusFilter);
};

/**
 * Fetch a single job by ID
 * @param id - Job ID
 * @returns ApiResponse with job data in UI format
 */
export const getJobById = async (
  id: string
): Promise<ApiResponse<Job>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`
        *,
        customer:customer_id (
          id,
          customer_code,
          customer_name,
          customer_address,
          phone_number,
          email
        ),
        location:location_id (
          id,
          customer_id,
          location_name,
          current_longitude,
          current_latitude,
          destination_longitude,
          destination_latitude
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      };
    }

    return {
      data: transformJobToUI(data as JobDB),
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'An unexpected error occurred',
        details: error,
      },
    };
  }
};

/**
 * Create a new job
 * @param job - Job data (without id)
 * @returns ApiResponse with created job in UI format
 */
export const createJob = async (
  job: Omit<JobDB, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'customer' | 'location'>
): Promise<ApiResponse<Job>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([job])
      .select(`
        *,
        customer:customer_id (
          id,
          customer_code,
          customer_name,
          customer_address,
          phone_number,
          email
        ),
        location:location_id (
          id,
          customer_id,
          location_name,
          current_longitude,
          current_latitude,
          destination_longitude,
          destination_latitude
        )
      `)
      .single();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      };
    }

    return {
      data: transformJobToUI(data as JobDB),
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'An unexpected error occurred',
        details: error,
      },
    };
  }
};

/**
 * Update an existing job
 * @param id - Job ID
 * @param updates - Partial job data to update
 * @returns ApiResponse with updated job in UI format
 */
export const updateJob = async (
  id: string,
  updates: Partial<Omit<JobDB, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'customer' | 'location'>>
): Promise<ApiResponse<Job>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        customer:customer_id (
          id,
          customer_code,
          customer_name,
          customer_address,
          phone_number,
          email
        ),
        location:location_id (
          id,
          customer_id,
          location_name,
          current_longitude,
          current_latitude,
          destination_longitude,
          destination_latitude
        )
      `)
      .single();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      };
    }

    return {
      data: transformJobToUI(data as JobDB),
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'An unexpected error occurred',
        details: error,
      },
    };
  }
};

/**
 * Delete a job (soft delete)
 * @param id - Job ID
 * @returns ApiResponse with success status
 */
export const deleteJob = async (
  id: string
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      };
    }

    return {
      data: { success: true },
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'An unexpected error occurred',
        details: error,
      },
    };
  }
};

/**
 * Fetch jobs assigned to a specific technician
 * Filters by technician_jobs.assignment_status instead of jobs.status
 * @param technicianId - Technician ID
 * @param isHistory - true for COMPLETED jobs, false for ASSIGNED/STARTED jobs
 * @returns ApiResponse with array of jobs in UI format
 */
export const getJobsForTechnician = async (
  technicianId: string,
  isHistory: boolean
): Promise<ApiResponse<Job[]>> => {
  try {
    // Define assignment status filter based on history flag
    const assignmentStatusFilter = isHistory
      ? ['COMPLETED', 'CANCELLED']
      : ['ASSIGNED', 'STARTED'];

    const { data, error } = await supabase
      .from('technician_jobs')
      .select(`
        assignment_status,
        job:job_id (
          id,
          job_number,
          title,
          description,
          priority,
          status,
          scheduled_start,
          scheduled_end,
          customer_id,
          location_id,
          customer:customer_id (
            id,
            customer_code,
            customer_name,
            customer_address,
            phone_number,
            email
          ),
          location:location_id (
            id,
            customer_id,
            location_name,
            current_longitude,
            current_latitude,
            destination_longitude,
            destination_latitude
          )
        )
      `)
      .eq('technician_id', technicianId)
      .in('assignment_status', assignmentStatusFilter)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      };
    }

    // Transform the data to extract jobs and transform to UI format
    const jobs = (data || [])
      .map((item: any) => item.job)
      .filter((job: any) => job !== null) // Filter out null jobs
      .map((job: JobDB) => transformJobToUI(job));

    return {
      data: jobs,
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'An unexpected error occurred',
        details: error,
      },
    };
  }
};
