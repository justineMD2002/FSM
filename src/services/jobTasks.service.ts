import { supabase } from '@/lib/supabase';
import { JobTask, TaskCompletion, ApiResponse } from '@/types';

/**
 * Job Tasks Service
 * Handles all job task and task completion database operations
 */

const JOB_TASKS_TABLE = 'job_tasks';
const TASK_COMPLETIONS_TABLE = 'task_completions';

/**
 * Fetch all tasks for a specific job
 * @param jobId - Job ID
 * @returns ApiResponse with array of job tasks
 */
export const getTasksByJobId = async (
  jobId: string
): Promise<ApiResponse<JobTask[]>> => {
  try {
    const { data, error } = await supabase
      .from(JOB_TASKS_TABLE)
      .select('*')
      .eq('job_id', jobId)
      .order('task_order', { ascending: true });

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
      data: data as JobTask[],
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
 * Create a new job task
 * @param task - Job task data
 * @returns ApiResponse with created job task
 */
export const createJobTask = async (
  task: Omit<JobTask, 'id'>
): Promise<ApiResponse<JobTask>> => {
  try {
    const { data, error } = await supabase
      .from(JOB_TASKS_TABLE)
      .insert([task])
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
      data: data as JobTask,
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
 * Update a job task
 * @param taskId - Job task ID
 * @param updates - Partial job task data to update
 * @returns ApiResponse with updated job task
 */
export const updateJobTask = async (
  taskId: string,
  updates: Partial<Omit<JobTask, 'id' | 'job_id'>>
): Promise<ApiResponse<JobTask>> => {
  try {
    const { data, error } = await supabase
      .from(JOB_TASKS_TABLE)
      .update(updates)
      .eq('id', taskId)
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
      data: data as JobTask,
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
 * Delete a job task
 * @param taskId - Job task ID
 * @returns ApiResponse with success status
 */
export const deleteJobTask = async (
  taskId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const { error } = await supabase
      .from(JOB_TASKS_TABLE)
      .delete()
      .eq('id', taskId);

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
 * Fetch task completions for a specific technician job
 * @param technicianJobId - Technician job ID
 * @returns ApiResponse with array of task completions
 */
export const getTaskCompletionsByTechnicianJobId = async (
  technicianJobId: string
): Promise<ApiResponse<TaskCompletion[]>> => {
  try {
    const { data, error } = await supabase
      .from(TASK_COMPLETIONS_TABLE)
      .select(`
        *,
        job_task:job_task_id (
          id,
          task_name,
          task_description,
          is_required
        )
      `)
      .eq('technician_job_id', technicianJobId);

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
      data: data as TaskCompletion[],
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
 * Update task status in batch
 * @param taskUpdates - Array of task IDs and their statuses
 * @returns ApiResponse with success status
 */
export const updateTaskStatuses = async (
  taskUpdates: { taskId: string; status: string }[]
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    // Update each task's status
    const promises = taskUpdates.map((update) =>
      supabase
        .from(JOB_TASKS_TABLE)
        .update({ status: update.status })
        .eq('id', update.taskId)
    );

    const results = await Promise.all(promises);

    // Check if any updates failed
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      return {
        data: null,
        error: {
          message: 'Failed to update some task statuses',
          details: errors,
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
 * Toggle task completion status
 * @param technicianJobId - Technician job ID
 * @param jobTaskId - Job task ID
 * @param isCompleted - Completion status
 * @param notes - Completion notes
 * @returns ApiResponse with task completion
 */
export const toggleTaskCompletion = async (
  technicianJobId: string,
  jobTaskId: string,
  isCompleted: boolean,
  notes?: string
): Promise<ApiResponse<TaskCompletion>> => {
  try {
    // Check if task completion record exists
    const { data: existing, error: fetchError } = await supabase
      .from(TASK_COMPLETIONS_TABLE)
      .select('*')
      .eq('technician_job_id', technicianJobId)
      .eq('job_task_id', jobTaskId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" error
      return {
        data: null,
        error: {
          message: fetchError.message,
          code: fetchError.code,
          details: fetchError.details,
        },
      };
    }

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from(TASK_COMPLETIONS_TABLE)
        .update({
          is_completed: isCompleted,
          completion_notes: notes,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', existing.id)
        .select(`
          *,
          job_task:job_task_id (
            id,
            task_name,
            task_description,
            is_required
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
        data: data as TaskCompletion,
        error: null,
      };
    } else {
      // Create new record
      const { data, error } = await supabase
        .from(TASK_COMPLETIONS_TABLE)
        .insert([{
          technician_job_id: technicianJobId,
          job_task_id: jobTaskId,
          is_completed: isCompleted,
          completion_notes: notes,
          completed_at: isCompleted ? new Date().toISOString() : null,
        }])
        .select(`
          *,
          job_task:job_task_id (
            id,
            task_name,
            task_description,
            is_required
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
        data: data as TaskCompletion,
        error: null,
      };
    }
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
