import { supabase } from '@/lib/supabase';
import { TechnicianJob, ApiResponse } from '@/types';

/**
 * Technician Jobs Service
 * Handles technician job assignments and status
 */

const TABLE_NAME = 'technician_jobs';

/**
 * Minimal type for ongoing job check (only fetches what's needed)
 */
interface OngoingJobInfo {
  id: string;
  job: {
    job_number: string;
  } | null;
}

/**
 * Fetch all technicians assigned to a job
 * @param jobId - Job ID
 * @returns ApiResponse with array of technician jobs
 */
export const getTechniciansByJobId = async (
  jobId: string
): Promise<ApiResponse<TechnicianJob[]>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`
        *,
        technician:technician_id (
          id,
          user_id,
          email,
          full_name,
          phone_number,
          status,
          is_online,
          avatar_url
        )
      `)
      .eq('job_id', jobId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

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
      data: data as TechnicianJob[],
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
 * Get technician job by ID
 * @param technicianJobId - Technician Job ID
 * @returns ApiResponse with technician job
 */
export const getTechnicianJobById = async (
  technicianJobId: string
): Promise<ApiResponse<TechnicianJob>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`
        *,
        technician:technician_id (
          id,
          user_id,
          email,
          full_name,
          phone_number,
          status,
          is_online,
          avatar_url
        )
      `)
      .eq('id', technicianJobId)
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
      data: data as TechnicianJob,
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
 * Update technician job status
 * @param technicianJobId - Technician Job ID
 * @param status - New status
 * @param remarks - Optional remarks
 * @returns ApiResponse with updated technician job
 */
export const updateTechnicianJobStatus = async (
  technicianJobId: string,
  status: 'ASSIGNED' | 'STARTED' | 'COMPLETED' | 'CANCELLED',
  remarks?: string
): Promise<ApiResponse<TechnicianJob>> => {
  try {
    const updates: any = {
      assignment_status: status,
    };

    if (status === 'STARTED') {
      updates.started_at = new Date().toISOString();
    } else if (status === 'COMPLETED') {
      updates.completed_at = new Date().toISOString();
    }

    if (remarks) {
      updates.technician_remarks = remarks;
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('id', technicianJobId)
      .select(`
        *,
        technician:technician_id (
          id,
          user_id,
          email,
          full_name,
          phone_number,
          status,
          is_online,
          avatar_url
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

    // When a technician starts a job, update the jobs table status to IN_PROGRESS
    // Only update if the job is not already IN_PROGRESS (first technician to start)
    if (status === 'STARTED' && data?.job_id) {
      // Check current job status
      const { data: jobData } = await supabase
        .from('jobs')
        .select('status')
        .eq('id', data.job_id)
        .single();

      // Only update if not already IN_PROGRESS
      if (jobData && jobData.status !== 'IN_PROGRESS') {
        await supabase
          .from('jobs')
          .update({ status: 'IN_PROGRESS' })
          .eq('id', data.job_id);
      }
    }

    // When a technician completes a job, check if all technicians have completed
    // If all have completed, update the jobs table status to COMPLETED
    if (status === 'COMPLETED' && data?.job_id) {
      // Get all technician assignments for this job (excluding cancelled ones)
      const { data: allAssignments } = await supabase
        .from(TABLE_NAME)
        .select('assignment_status')
        .eq('job_id', data.job_id)
        .is('deleted_at', null)
        .neq('assignment_status', 'CANCELLED');

      if (allAssignments && allAssignments.length > 0) {
        // Check if all assignments are completed
        const allCompleted = allAssignments.every(
          (assignment) => assignment.assignment_status === 'COMPLETED'
        );

        if (allCompleted) {
          await supabase
            .from('jobs')
            .update({ status: 'COMPLETED' })
            .eq('id', data.job_id);
        }
      }
    }

    return {
      data: data as TechnicianJob,
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
 * Get current user's technician job for a specific job
 * @param jobId - Job ID
 * @param userId - User ID
 * @returns ApiResponse with technician job or null
 */
export const getCurrentUserTechnicianJob = async (
  jobId: string,
  userId: string
): Promise<ApiResponse<TechnicianJob | null>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`
        *,
        technician:technician_id!inner (
          id,
          user_id,
          email,
          full_name,
          phone_number,
          status,
          is_online,
          avatar_url
        )
      `)
      .eq('job_id', jobId)
      .eq('technician.user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();

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
      data: data as TechnicianJob | null,
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
 * Update service report submission status
 * @param technicianJobId - Technician Job ID
 * @param isSubmitted - Whether the service report has been submitted
 * @returns ApiResponse with updated technician job
 */
export const updateServiceReportSubmission = async (
  technicianJobId: string,
  isSubmitted: boolean
): Promise<ApiResponse<TechnicianJob>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        is_service_report_submitted: isSubmitted,
        updated_at: new Date().toISOString(),
      })
      .eq('id', technicianJobId)
      .select(`
        *,
        technician:technician_id (
          id,
          user_id,
          email,
          full_name,
          phone_number,
          status,
          is_online,
          avatar_url
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
      data: data as TechnicianJob,
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
 * Check if a technician has any ongoing (started) jobs
 * @param userId - User ID
 * @returns ApiResponse with array of ongoing jobs (minimal info), empty array if none found
 */
export const checkOngoingJobs = async (
  userId: string
): Promise<ApiResponse<OngoingJobInfo[]>> => {
  try {
    // First get the technician ID from user ID
    const { data: techData, error: techError } = await supabase
      .from('technicians')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (techError || !techData) {
      return {
        data: null,
        error: {
          message: techError?.message || 'Technician not found',
          code: techError?.code,
          details: techError?.details,
        },
      };
    }

    // Check for any jobs with STARTED status
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`
        id,
        job:job_id (
          job_number
        )
      `)
      .eq('technician_id', techData.id)
      .eq('assignment_status', 'STARTED')
      .is('deleted_at', null)
      .order('started_at', { ascending: true });

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
      data: (data as any) || [],
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
