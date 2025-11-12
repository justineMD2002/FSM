import { supabase } from '@/lib/supabase';
import { Location, ApiResponse } from '@/types';

/**
 * Locations Service
 * Handles all location-related database operations
 */

const TABLE_NAME = 'locations';

/**
 * Get location by ID
 * @param id - Location ID
 * @returns ApiResponse with location data
 */
export const getLocationById = async (
  id: string
): Promise<ApiResponse<Location>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
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
      data: data as Location,
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
 * Update location's current coordinates (where technician started the job)
 * @param locationId - Location ID
 * @param latitude - Current latitude
 * @param longitude - Current longitude
 * @returns ApiResponse with updated location
 */
export const updateCurrentLocation = async (
  locationId: string,
  latitude: number,
  longitude: number
): Promise<ApiResponse<Location>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        current_latitude: latitude.toString(),
        current_longitude: longitude.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', locationId)
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
      data: data as Location,
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
 * Update location's destination coordinates (job site location)
 * @param locationId - Location ID
 * @param latitude - Destination latitude
 * @param longitude - Destination longitude
 * @returns ApiResponse with updated location
 */
export const updateDestinationLocation = async (
  locationId: string,
  latitude: number,
  longitude: number
): Promise<ApiResponse<Location>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        destination_latitude: latitude.toString(),
        destination_longitude: longitude.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', locationId)
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
      data: data as Location,
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
 * Create a new location record
 * @param customerId - Customer ID
 * @param locationName - Name of the location
 * @param destinationLat - Destination latitude (optional)
 * @param destinationLng - Destination longitude (optional)
 * @returns ApiResponse with created location
 */
export const createLocation = async (
  customerId: string,
  locationName: string | null,
  destinationLat?: number,
  destinationLng?: number
): Promise<ApiResponse<Location>> => {
  try {
    const locationData: any = {
      customer_id: customerId,
      location_name: locationName,
    };

    if (destinationLat !== undefined && destinationLng !== undefined) {
      locationData.destination_latitude = destinationLat.toString();
      locationData.destination_longitude = destinationLng.toString();
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([locationData])
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
      data: data as Location,
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
 * Get location by customer ID
 * @param customerId - Customer ID
 * @returns ApiResponse with array of locations
 */
export const getLocationsByCustomerId = async (
  customerId: string
): Promise<ApiResponse<Location[]>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('customer_id', customerId)
      .is('deleted_at', null);

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
      data: data as Location[],
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
