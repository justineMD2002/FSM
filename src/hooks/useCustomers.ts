import { useState, useEffect, useCallback } from 'react';
import { Customer, ApiError } from '@/types';
import * as customersService from '@/services/customers.service';

interface UseCustomersReturn {
  customers: Customer[];
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing customers data
 * Provides customers list, loading state, error handling, and refetch functionality
 * Search/filtering should be done client-side on the returned data
 *
 * @returns UseCustomersReturn object with customers data and operations
 *
 * @example
 * const { customers, loading, error, refetch } = useCustomers();
 *
 * // Refetch all customers
 * await refetch();
 *
 * // Filter customers client-side
 * const filtered = customers.filter(c => c.customer_name.includes(query));
 */
export const useCustomers = (): UseCustomersReturn => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  /**
   * Fetch all customers from the database
   */
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await customersService.getAllCustomers();

      if (response.error) {
        setError(response.error);
        setCustomers([]);
      } else {
        setCustomers(response.data || []);
        setError(null);
      }
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to fetch customers',
        details: err,
      });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refetch all customers
   */
  const refetch = useCallback(async () => {
    await fetchCustomers();
  }, [fetchCustomers]);

  // Initial fetch on mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    refetch,
  };
};

interface UseCustomerReturn {
  customer: Customer | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching a single customer by ID
 *
 * @param customerId - The ID of the customer to fetch
 * @returns UseCustomerReturn object with customer data and operations
 *
 * @example
 * const { customer, loading, error, refetch } = useCustomer('123');
 */
export const useCustomer = (customerId: string): UseCustomerReturn => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchCustomer = useCallback(async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await customersService.getCustomerById(customerId);

      if (response.error) {
        setError(response.error);
        setCustomer(null);
      } else {
        setCustomer(response.data);
        setError(null);
      }
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to fetch customer',
        details: err,
      });
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const refetch = useCallback(async () => {
    await fetchCustomer();
  }, [fetchCustomer]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  return {
    customer,
    loading,
    error,
    refetch,
  };
};
