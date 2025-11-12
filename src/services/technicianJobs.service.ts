import { supabase } from '@/lib/supabase';
import { TechnicianJob, ApiResponse } from '@/types';

/**
 * Technician Jobs Service
 * Handles technician job assignments and status
 */

const TABLE_NAME = 'technician_jobs';

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
