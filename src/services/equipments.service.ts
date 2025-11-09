import { supabase } from '@/lib/supabase';
import { Equipment, JobEquipment, ApiResponse } from '@/types';

/**
 * Equipments Service
 * Handles all equipment-related database operations
 */

const EQUIPMENT_TABLE = 'equipments';
const JOB_EQUIPMENT_TABLE = 'job_equipments';

/**
 * Fetch all equipments for a specific customer
 * @param customerId - Customer ID
 * @returns ApiResponse with array of equipments
 */
export const getEquipmentsByCustomerId = async (
  customerId: string
): Promise<ApiResponse<Equipment[]>> => {
  try {
    const { data, error } = await supabase
      .from(EQUIPMENT_TABLE)
      .select('*')
      .eq('customer_id', customerId)
      .is('deleted_at', null)
      .order('item_name', { ascending: true });

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
      data: data as Equipment[],
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
 * Fetch all job equipments for a specific job
 * @param jobId - Job ID
 * @returns ApiResponse with array of job equipments with equipment details
 */
export const getJobEquipmentsByJobId = async (
  jobId: string
): Promise<ApiResponse<JobEquipment[]>> => {
  try {
    const { data, error } = await supabase
      .from(JOB_EQUIPMENT_TABLE)
      .select(`
        *,
        equipment:equipment_id (
          id,
          item_code,
          item_name,
          model_series,
          serial_number,
          brand,
          equipment_type,
          equipment_location
        )
      `)
      .eq('job_id', jobId);

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
      data: data as JobEquipment[],
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
 * Add equipment to a job
 * @param jobEquipment - Job equipment data
 * @returns ApiResponse with created job equipment
 */
export const addEquipmentToJob = async (
  jobEquipment: Omit<JobEquipment, 'id' | 'created_at' | 'equipment'>
): Promise<ApiResponse<JobEquipment>> => {
  try {
    const { data, error } = await supabase
      .from(JOB_EQUIPMENT_TABLE)
      .insert([jobEquipment])
      .select(`
        *,
        equipment:equipment_id (
          id,
          item_code,
          item_name,
          model_series,
          serial_number,
          brand
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
      data: data as JobEquipment,
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
 * Remove equipment from a job
 * @param jobEquipmentId - Job equipment ID
 * @returns ApiResponse with success status
 */
export const removeEquipmentFromJob = async (
  jobEquipmentId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const { error } = await supabase
      .from(JOB_EQUIPMENT_TABLE)
      .delete()
      .eq('id', jobEquipmentId);

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
