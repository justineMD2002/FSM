import { supabase } from '@/lib/supabase';
import { Followup, ApiResponse } from '@/types';

/**
 * Followups Service
 * Handles all followup-related database operations
 */

const TABLE_NAME = 'followups';

/**
 * Fetch all followups for a specific job
 * @param jobId - Job ID
 * @returns ApiResponse with array of followups
 */
export const getFollowupsByJobId = async (
  jobId: string
): Promise<ApiResponse<Followup[]>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`
        *,
        technician:technician_id (
          id,
          full_name,
          email,
          phone_number
        )
      `)
      .eq('job_id', jobId)
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

    return {
      data: data as Followup[],
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
 * Create a new followup
 * @param followup - Followup data
 * @returns ApiResponse with created followup
 */
export const createFollowup = async (
  followup: Omit<Followup, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'technician'>
): Promise<ApiResponse<Followup>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([followup])
      .select(`
        *,
        technician:technician_id (
          id,
          full_name,
          email,
          phone_number
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
      data: data as Followup,
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
 * Update a followup
 * @param followupId - Followup ID
 * @param updates - Partial followup data to update
 * @returns ApiResponse with updated followup
 */
export const updateFollowup = async (
  followupId: string,
  updates: Partial<Omit<Followup, 'id' | 'job_id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at' | 'technician'>>
): Promise<ApiResponse<Followup>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('id', followupId)
      .select(`
        *,
        technician:technician_id (
          id,
          full_name,
          email,
          phone_number
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
      data: data as Followup,
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
 * Delete a followup (soft delete)
 * @param followupId - Followup ID
 * @returns ApiResponse with success status
 */
export const deleteFollowup = async (
  followupId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', followupId);

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
