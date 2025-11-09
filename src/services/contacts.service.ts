import { supabase } from '@/lib/supabase';
import { Contact, ApiResponse } from '@/types';

/**
 * Contacts Service
 * Handles all contact person-related database operations
 */

const TABLE_NAME = 'contacts';

/**
 * Fetch all contacts for a specific customer
 * @param customerId - Customer ID
 * @returns ApiResponse with array of contacts
 */
export const getContactsByCustomerId = async (
  customerId: string
): Promise<ApiResponse<Contact[]>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('customer_id', customerId)
      .order('first_name', { ascending: true });

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
      data: data as Contact[],
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
 * Get a single contact by ID
 * @param contactId - Contact ID
 * @returns ApiResponse with contact data
 */
export const getContactById = async (
  contactId: string
): Promise<ApiResponse<Contact>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', contactId)
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
      data: data as Contact,
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
