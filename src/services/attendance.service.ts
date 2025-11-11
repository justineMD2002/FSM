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

/**
 * Set break status for current attendance record
 * @param attendanceId - The attendance record ID
 * @param isBreak - true to start break, false to end break
 * @returns Updated attendance record
 */
export const setBreakStatus = async (
  attendanceId: string,
  isBreak: boolean
): Promise<ApiResponse<AttendanceRecord>> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .update({
        is_break: isBreak,
        updated_at: new Date().toISOString()
      })
      .eq('id', attendanceId)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: { message: error.message },
      };
    }

    return {
      data: data as AttendanceRecord,
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: { message: error?.message || 'Failed to update break status' },
    };
  }
};

/**
 * Get technician status based on attendance
 * @param technicianId - The technician ID
 * @returns Status: 'Online', 'Break', or 'Offline'
 */
export const getTechnicianStatus = async (
  technicianId: string
): Promise<ApiResponse<{ status: 'Online' | 'Break' | 'Offline'; attendance: AttendanceRecord | null }>> => {
  try {
    // Check for active attendance today (clock_in exists, clock_out is null)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('technician_id', technicianId)
      .is('clock_out', null)
      .gte('clock_in', today.toISOString())
      .order('clock_in', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return {
        data: null,
        error: { message: error.message },
      };
    }

    // Determine status
    if (!data) {
      // Not clocked in today
      return {
        data: { status: 'Offline', attendance: null },
        error: null,
      };
    }

    // Clocked in - check break status
    const status = data.is_break === true ? 'Break' : 'Online';

    return {
      data: { status, attendance: data as AttendanceRecord },
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: { message: error?.message || 'Failed to get technician status' },
    };
  }
};
