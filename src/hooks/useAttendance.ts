import { useState, useEffect, useCallback } from 'react';
import { AttendanceRecord, ApiError } from '@/types';
import { getTechnicianStatus, setBreakStatus } from '@/services/attendance.service';
import { supabase } from '@/lib/supabase';

interface UseTechnicianStatusReturn {
  status: 'Online' | 'Break' | 'Offline';
  attendance: AttendanceRecord | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  toggleBreak: () => Promise<void>;
  updatingBreak: boolean;
}

/**
 * Custom hook for managing technician status based on attendance
 * Provides status (Online/Break/Offline), attendance data, and break toggle functionality
 * Includes real-time updates via Supabase subscriptions
 *
 * @param technicianId - The technician ID to track
 * @returns UseTechnicianStatusReturn object with status data and operations
 *
 * @example
 * const { status, attendance, toggleBreak } = useTechnicianStatus('tech-123');
 */
export const useTechnicianStatus = (technicianId: string | null): UseTechnicianStatusReturn => {
  const [status, setStatus] = useState<'Online' | 'Break' | 'Offline'>('Offline');
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [updatingBreak, setUpdatingBreak] = useState<boolean>(false);

  /**
   * Fetch technician status from the database
   */
  const fetchStatus = useCallback(async () => {
    if (!technicianId) {
      setStatus('Offline');
      setAttendance(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await getTechnicianStatus(technicianId);

      if (response.error) {
        setError(response.error);
        setStatus('Offline');
        setAttendance(null);
      } else if (response.data) {
        setStatus(response.data.status);
        setAttendance(response.data.attendance);
        setError(null);
      }
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to fetch technician status',
        details: err,
      });
      setStatus('Offline');
      setAttendance(null);
    } finally {
      setLoading(false);
    }
  }, [technicianId]);

  /**
   * Toggle break status
   */
  const toggleBreak = useCallback(async () => {
    if (!attendance?.id) {
      console.error('No active attendance record to toggle break');
      return;
    }

    try {
      setUpdatingBreak(true);
      const newBreakStatus = status !== 'Break'; // Toggle: if currently on break, end it; otherwise start it

      const response = await setBreakStatus(attendance.id, newBreakStatus);

      if (response.error) {
        alert(`Error updating break status: ${response.error.message}`);
      } else {
        // Refetch to get updated status
        await fetchStatus();
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setUpdatingBreak(false);
    }
  }, [attendance, status, fetchStatus]);

  /**
   * Refetch technician status
   */
  const refetch = useCallback(async () => {
    await fetchStatus();
  }, [fetchStatus]);

  // Initial fetch on mount and when technicianId changes
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Set up real-time subscription for attendance changes
  useEffect(() => {
    if (!technicianId) return;

    // Subscribe to changes on the attendance table for this technician
    const subscription = supabase
      .channel(`attendance_${technicianId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'attendance',
          filter: `technician_id=eq.${technicianId}`,
        },
        (payload) => {
          console.log('Real-time attendance update received:', payload);
          // Refetch status when any change occurs
          refetch();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [technicianId, refetch]);

  return {
    status,
    attendance,
    loading,
    error,
    refetch,
    toggleBreak,
    updatingBreak,
  };
};
