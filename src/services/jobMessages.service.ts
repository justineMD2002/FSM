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
 * Update a message (edit message text)
 * @param messageId - Message ID
 * @param messageText - New message text
 * @returns ApiResponse with updated message
 */
export const updateMessage = async (
  messageId: string,
  messageText: string
): Promise<ApiResponse<JobTechnicianAdminMessage>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        message: messageText,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
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
 * Delete a message for everyone (soft delete)
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

/**
 * Bulk delete messages for everyone (soft delete)
 * @param messageIds - Array of message IDs
 * @returns ApiResponse with success status
 */
export const deleteMessagesBulk = async (
  messageIds: string[]
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ deleted_at: new Date().toISOString() })
      .in('id', messageIds);

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
 * Delete a message for the current user only (soft delete for user)
 * @param messageId - Message ID
 * @param userId - Current user ID
 * @returns ApiResponse with success status
 */
export const deleteMessageForUser = async (
  messageId: string,
  userId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    // First, get the current deleted_by_user_ids array
    const { data: messageData, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('deleted_by_user_ids')
      .eq('id', messageId)
      .single();

    if (fetchError) {
      return {
        data: null,
        error: {
          message: fetchError.message,
          code: fetchError.code,
          details: fetchError.details,
        },
      };
    }

    // Add the user ID to the array (if not already present)
    const deletedByUserIds = messageData?.deleted_by_user_ids || [];
    if (!deletedByUserIds.includes(userId)) {
      deletedByUserIds.push(userId);
    }

    // Update the message with the new array
    const { error: updateError } = await supabase
      .from(TABLE_NAME)
      .update({ deleted_by_user_ids: deletedByUserIds })
      .eq('id', messageId);

    if (updateError) {
      return {
        data: null,
        error: {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
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
 * Bulk delete messages for the current user only (soft delete for user)
 * @param messageIds - Array of message IDs
 * @param userId - Current user ID
 * @returns ApiResponse with success status
 */
export const deleteMessagesForUserBulk = async (
  messageIds: string[],
  userId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    // For each message, add the user ID to deleted_by_user_ids array
    for (const messageId of messageIds) {
      const result = await deleteMessageForUser(messageId, userId);
      if (result.error) {
        return result;
      }
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
