import { supabase } from '@/lib/supabase';
import { Customer, ApiResponse, ApiError } from '@/types';

/**
 * Customer Service
 * Handles all customer-related database operations
 */

const TABLE_NAME = 'customer';

/**
 * Fetch all customers from the database
 * @param searchQuery - Optional search query to filter customers
 * @returns ApiResponse with array of customers
 */
export const getAllCustomers = async (
  searchQuery?: string
): Promise<ApiResponse<Customer[]>> => {
  try {
    let query = supabase
      .from(TABLE_NAME)
      .select('*')
      .order('customer_name', { ascending: true });

    // Apply search filter if provided
    if (searchQuery && searchQuery.trim()) {
      query = query.or(
        `customer_name.ilike.%${searchQuery}%,customer_code.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%`
      );
    }

    const { data, error } = await query;

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
      data: data as Customer[],
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
 * Fetch a single customer by ID
 * @param id - Customer ID
 * @returns ApiResponse with customer data
 */
export const getCustomerById = async (
  id: string
): Promise<ApiResponse<Customer>> => {
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
      data: data as Customer,
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
 * Create a new customer
 * @param customer - Customer data (without id)
 * @returns ApiResponse with created customer
 */
export const createCustomer = async (
  customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<Customer>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([customer])
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
      data: data as Customer,
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
 * Update an existing customer
 * @param id - Customer ID
 * @param updates - Partial customer data to update
 * @returns ApiResponse with updated customer
 */
export const updateCustomer = async (
  id: string,
  updates: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>
): Promise<ApiResponse<Customer>> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('id', id)
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
      data: data as Customer,
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
 * Delete a customer
 * @param id - Customer ID
 * @returns ApiResponse with success status
 */
export const deleteCustomer = async (
  id: string
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

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
 * Check if a customer code already exists
 * @param customerCode - Customer code to check
 * @param excludeId - Optional customer ID to exclude from check (for updates)
 * @returns ApiResponse with boolean indicating if code exists
 */
export const customerCodeExists = async (
  customerCode: string,
  excludeId?: string
): Promise<ApiResponse<boolean>> => {
  try {
    let query = supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('customer_code', customerCode);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

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
      data: data.length > 0,
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
