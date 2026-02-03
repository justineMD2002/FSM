import { supabase } from '@/lib/supabase';
import { JobTechnicianAdminMessage, ApiResponse } from '@/types';

/**
 * Job Messages Service
 * Handles all job message-related database operations
 */

const TABLE_NAME = 'job_technician_admin_messages';

/**
 * Fetch all messages for a specific job
 * @param jobId - Job ID
 * @returns ApiResponse with array of messages
 */
export const getMessagesByJobId = async (
  jobId: string
): Promise<ApiResponse<JobTechnicianAdminMessage[]>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`
        *,
        technician_job:technician_job_id (
          technician:technician_id (
            full_name
          )
        ),
        admin:admin_id (
          full_name
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
      data: data as JobTechnicianAdminMessage[],
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
 * Create a new message
 * @param message - Message data
 * @returns ApiResponse with created message
 */
export const createMessage = async (
  message: Omit<JobTechnicianAdminMessage, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<ApiResponse<JobTechnicianAdminMessage>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([message])
      .select()
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
      data: data as JobTechnicianAdminMessage,
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
 * Create multiple messages in batch (for service report images)
 * @param messages - Array of message data
 * @returns ApiResponse with created messages
 */
export const createMessagesBatch = async (
  messages: Omit<JobTechnicianAdminMessage, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>[]
): Promise<ApiResponse<JobTechnicianAdminMessage[]>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(messages)
      .select();

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
      data: data as JobTechnicianAdminMessage[],
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
 * Delete a message (soft delete)
 * @param messageId - Message ID
 * @returns ApiResponse with success status
 */
export const deleteMessage = async (
  messageId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId);

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
