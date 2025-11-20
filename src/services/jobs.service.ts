import { supabase } from '@/lib/supabase';
import { JobDB, Job, ApiResponse } from '@/types';
import { stripHtmlTags } from '@/utils';

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
  // Format as dd-mm-yyyy
  const day = scheduledDate.getDate().toString().padStart(2, '0');
  const month = (scheduledDate.getMonth() + 1).toString().padStart(2, '0');
  const year = scheduledDate.getFullYear();
  const date = `${day}-${month}-${year}`;
  const time = scheduledDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Parse scheduled_end to get end date and time
  let endDate: string | undefined;
  let endTime: string | undefined;
  if (dbJob.scheduled_end) {
    const scheduledEndDate = new Date(dbJob.scheduled_end);
    // Format as dd-mm-yyyy
    const endDay = scheduledEndDate.getDate().toString().padStart(2, '0');
    const endMonth = (scheduledEndDate.getMonth() + 1).toString().padStart(2, '0');
    const endYear = scheduledEndDate.getFullYear();
    endDate = `${endDay}-${endMonth}-${endYear}`;
    endTime = scheduledEndDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  // Map status to UI status (COMPLETED, CANCELLED, CREATED, SCHEDULED, RESCHEDULED, IN_PROGRESS)
  let uiStatus: 'COMPLETED' | 'CANCELLED' | 'CREATED' | 'SCHEDULED' | 'RESCHEDULED' | 'IN_PROGRESS' = 'CREATED';

  if (dbJob.status === 'COMPLETED') {
    uiStatus = 'COMPLETED';
  } else if (dbJob.status === 'CANCELLED') {
    uiStatus = 'CANCELLED';
  } else if (dbJob.status === 'IN_PROGRESS') {
    uiStatus = 'IN_PROGRESS';
  } else if (dbJob.status === 'SCHEDULED') {
    uiStatus = 'SCHEDULED';
  } else if (dbJob.status === 'RESCHEDULED') {
    uiStatus = 'RESCHEDULED';
  } else {
    // CREATED, OVERDUE, WAITING all map to CREATED in UI
    uiStatus = 'CREATED';
  }

  // Build address with location_name, country_name, and zip_code from customer_location
  const baseAddress = dbJob.location?.location_name || dbJob.customer?.customer_address || 'No address provided';

  // Get customer_location data (first record if available)
  const customerLocation = dbJob.customer?.customer_location?.[0];

  // Build address parts
  const addressParts: string[] = [baseAddress];

  if (customerLocation?.country_name) {
    addressParts.push(customerLocation.country_name);
  }
  if (customerLocation?.zip_code) {
    addressParts.push(customerLocation.zip_code);
  }

  const address = addressParts.join(', ');

  return {
    id: dbJob.id,
    jobName: dbJob.title,
    jobCode: dbJob.job_number,
    date,
    time,
    endDate,
    endTime,
    customer: dbJob.customer?.customer_name || 'Unknown Customer',
    customerId: dbJob.customer_id,
    // Use location_name with country_name and zip_code if available
    address,
    locationName: dbJob.location?.location_name || null,
    notes: stripHtmlTags(dbJob.description) || '',
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
          email,
          customer_location (
            country_name,
            zip_code
          )
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
 * @param isHistory - true for COMPLETED/CANCELLED jobs, false for CREATED/SCHEDULED/RESCHEDULED/IN_PROGRESS
 * @returns ApiResponse with array of jobs in UI format
 */
export const getJobsByType = async (
  isHistory: boolean
): Promise<ApiResponse<Job[]>> => {
  const statusFilter = isHistory
    ? ['COMPLETED', 'CANCELLED']
    : ['CREATED', 'SCHEDULED', 'RESCHEDULED', 'IN_PROGRESS', 'OVERDUE', 'WAITING'];

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
          email,
          customer_location (
            country_name,
            zip_code
          )
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
          email,
          customer_location (
            country_name,
            zip_code
          )
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
          email,
          customer_location (
            country_name,
            zip_code
          )
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
 * Fetch a single job by ID for a specific technician (includes assignment status)
 * @param jobId - Job ID
 * @param technicianId - Technician ID
 * @returns ApiResponse with job data in UI format including technicianAssignmentStatus
 */
export const getJobByIdForTechnician = async (
  jobId: string,
  technicianId: string
): Promise<ApiResponse<Job>> => {
  try {
    const { data, error } = await supabase
      .from('technician_jobs')
      .select(`
        assignment_status,
        job:job_id!inner (
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
            email,
            customer_location (
              country_name,
              zip_code
            )
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
      .eq('job_id', jobId)
      .is('deleted_at', null)
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

    if (!data || !data.job) {
      return {
        data: null,
        error: {
          message: 'Job not found or not assigned to technician',
        },
      };
    }

    // Transform job and add technician assignment status
    // data.job comes as an array from Supabase, get first element
    const jobData: any = Array.isArray(data.job) ? data.job[0] : data.job;
    const job = transformJobToUI(jobData);
    job.technicianAssignmentStatus = data.assignment_status;

    return {
      data: job,
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
    // Fetch all assignment statuses, then filter by job.status for cancelled/rescheduled
    const assignmentStatusFilter = ['ASSIGNED', 'STARTED', 'COMPLETED', 'CANCELLED'];

    const { data, error } = await supabase
      .from('technician_jobs')
      .select(`
        assignment_status,
        job:job_id!inner (
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
            email,
            customer_location (
              country_name,
              zip_code
            )
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
      .is('deleted_at', null)
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

    // Log for debugging
    console.log(`[getJobsForTechnician] Fetched ${data?.length || 0} jobs, isHistory=${isHistory}`);

    // Transform the data to extract jobs and transform to UI format
    const jobs = (data || [])
      .filter((item: any) => item.job !== null) // Filter out null jobs
      .map((item: any) => {
        const jobStatus = item.job.status;
        const assignmentStatus = item.assignment_status;

        console.log(`[Job ${item.job.job_number}] jobStatus=${jobStatus}, assignmentStatus=${assignmentStatus}`);

        // For technicians, we filter based on THEIR assignment_status, not the main job status
        // This allows each technician to see their own completed jobs in history
        // even if other technicians haven't completed yet
        const isAssignmentCompleted = ['COMPLETED', 'CANCELLED'].includes(assignmentStatus);
        const isAssignmentActive = ['ASSIGNED', 'STARTED'].includes(assignmentStatus);

        // Also check if the main job is cancelled (then it should be in history for everyone)
        const isJobCancelled = jobStatus === 'CANCELLED';

        let shouldIncludeInCurrent = false;
        let shouldIncludeInHistory = false;

        // Determine which tab this job belongs to based on technician's assignment status
        if (isAssignmentCompleted || isJobCancelled) {
          // This technician completed their assignment OR the job was cancelled
          shouldIncludeInHistory = true;
        } else if (isAssignmentActive) {
          // This technician's assignment is still active
          shouldIncludeInCurrent = true;
        }

        console.log(`[Job ${item.job.job_number}] shouldIncludeInCurrent=${shouldIncludeInCurrent}, shouldIncludeInHistory=${shouldIncludeInHistory}, requestedHistory=${isHistory}`);

        return {
          item,
          shouldIncludeInCurrent,
          shouldIncludeInHistory
        };
      })
      .filter(({ shouldIncludeInCurrent, shouldIncludeInHistory }) => {
        return isHistory ? shouldIncludeInHistory : shouldIncludeInCurrent;
      })
      .map(({ item }) => {
        const job = transformJobToUI(item.job);
        // Add technician assignment status to the job
        job.technicianAssignmentStatus = item.assignment_status;
        return job;
      });

    console.log(`[getJobsForTechnician] Returning ${jobs.length} jobs for ${isHistory ? 'HISTORY' : 'CURRENT'} tab`);

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
