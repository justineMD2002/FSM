import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/types';

/**
 * Location Technicians Service
 * Handles location tracking for technicians (clock in locations and real-time tracking)
 */

const TABLE_NAME = 'location_technicians';

export interface LocationTechnicianRecord {
  id: string;
  technician_id: string;
  tracked_at: string;
  current_longitude: string;
  current_latitude: string;
  destination_longitude: string | null;
  destination_latitude: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Create a location_technicians record (typically when technician clocks in)
 * @param technicianId - Technician ID
 * @param latitude - Current latitude
 * @param longitude - Current longitude
 * @returns ApiResponse with created location technician record
 */
export const createLocationTechnicianRecord = async (
  technicianId: string,
  latitude: number,
  longitude: number
): Promise<ApiResponse<LocationTechnicianRecord>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([
        {
          technician_id: technicianId,
          tracked_at: new Date().toISOString(),
          current_latitude: latitude.toString(),
          current_longitude: longitude.toString(),
          destination_latitude: null,
          destination_longitude: null,
        },
      ])
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
      data: data as LocationTechnicianRecord,
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
 * Update technician's current location
 * @param technicianId - Technician ID
 * @param latitude - Current latitude
 * @param longitude - Current longitude
 * @returns ApiResponse with updated location technician record
 */
export const updateTechnicianCurrentLocation = async (
  technicianId: string,
  latitude: number,
  longitude: number
): Promise<ApiResponse<LocationTechnicianRecord>> => {
  try {
    // Get the most recent record for this technician
    const { data: existingRecord } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('technician_id', technicianId)
      .order('tracked_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existingRecord) {
      // No existing record, create a new one
      return await createLocationTechnicianRecord(technicianId, latitude, longitude);
    }

    // Update existing record
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        current_latitude: latitude.toString(),
        current_longitude: longitude.toString(),
        tracked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingRecord.id)
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
      data: data as LocationTechnicianRecord,
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
 * Get the latest location record for a technician
 * @param technicianId - Technician ID
 * @returns ApiResponse with location technician record
 */
export const getLatestTechnicianLocation = async (
  technicianId: string
): Promise<ApiResponse<LocationTechnicianRecord>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('technician_id', technicianId)
      .order('tracked_at', { ascending: false })
      .limit(1)
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
      data: data as LocationTechnicianRecord | null,
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
