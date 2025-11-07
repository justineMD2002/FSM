import { supabase } from '@/lib/supabase';
import { AttendanceRecord } from '@/types';

export interface ApiResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

/**
 * Check if a technician is currently clocked in
 * @param userId - The user ID of the technician
 * @returns Active attendance record if clocked in, null otherwise
 */
export const checkClockInStatus = async (userId: string): Promise<ApiResponse<AttendanceRecord>> => {
  try {
    // First get the technician ID from the user ID
    const { data: techData, error: techError } = await supabase
      .from('technicians')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (techError || !techData) {
      return {
        data: null,
        error: { message: techError?.message || 'Technician not found' },
      };
    }

    // Check for active attendance (clock_in exists, clock_out is null)
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('technician_id', techData.id)
      .is('clock_out', null)
      .order('clock_in', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return {
        data: null,
        error: { message: error.message },
      };
    }

    return {
      data: data || null,
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: { message: error?.message || 'Failed to check clock-in status' },
    };
  }
};

/**
 * Get all attendance records for a technician
 * @param userId - The user ID of the technician
 * @returns Array of attendance records
 */
export const getAttendanceHistory = async (userId: string): Promise<ApiResponse<AttendanceRecord[]>> => {
  try {
    // First get the technician ID from the user ID
    const { data: techData, error: techError } = await supabase
      .from('technicians')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (techError || !techData) {
      return {
        data: null,
        error: { message: techError?.message || 'Technician not found' },
      };
    }

    // Get all attendance records
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('technician_id', techData.id)
      .order('clock_in', { ascending: false });

    if (error) {
      return {
        data: null,
        error: { message: error.message },
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: { message: error?.message || 'Failed to get attendance history' },
    };
  }
};
