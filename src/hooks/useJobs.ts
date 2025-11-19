import { useState, useEffect, useCallback } from 'react';
import { Job, ApiError } from '@/types';
import * as jobsService from '@/services/jobs.service';
import * as technicianJobsService from '@/services/technicianJobs.service';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';

interface UseJobsReturn {
  jobs: Job[];
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing jobs data
 * Provides jobs list, loading state, error handling, and refetch functionality
 * Includes real-time updates via Supabase subscriptions
 *
 * @param isHistory - true for history jobs (COMPLETED/CANCELLED), false for current jobs (PENDING/UPCOMING/IN_PROGRESS)
 * @returns UseJobsReturn object with jobs data and operations
 *
 * @example
 * // Fetch current jobs
 * const { jobs, loading, error, refetch } = useJobs(false);
 *
 * // Fetch history jobs
 * const { jobs: historyJobs, loading, error, refetch } = useJobs(true);
 */
export const useJobs = (isHistory: boolean = false): UseJobsReturn => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [technicianId, setTechnicianId] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);

  // Fetch technician ID once when user is available
  useEffect(() => {
    const fetchTechnicianId = async () => {
      if (!user?.id) {
        setTechnicianId(null);
        return;
      }

      const { data: technicianData, error: techError } = await supabase
        .from('technicians')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (technicianData && !techError) {
        setTechnicianId(technicianData.id);
      } else {
        setTechnicianId(null);
      }
    };

    fetchTechnicianId();
  }, [user?.id]);

  /**
   * Fetch jobs from the database based on type (history or current)
   * Filters by technician_jobs.assignment_status for the current user
   */
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setError({ message: 'User not authenticated' });
        setJobs([]);
        setLoading(false);
        return;
      }

      // Wait for technicianId to be available - don't treat it as an error during initial load
      if (!technicianId) {
        // Keep loading true, don't set error yet - technicianId is being fetched
        return;
      }

      // Fetch jobs for this technician using the new function
      const response = await jobsService.getJobsForTechnician(technicianId, isHistory);

      if (response.error) {
        setError(response.error);
        setJobs([]);
      } else {
        setJobs(response.data || []);
        setError(null);
      }
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to fetch jobs',
        details: err,
      });
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [isHistory, user?.id, technicianId]);

  /**
   * Refetch all jobs
   */
  const refetch = useCallback(async () => {
    await fetchJobs();
  }, [fetchJobs]);

  // Initial fetch on mount and when isHistory changes
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Set up real-time subscription for technician_jobs
  useEffect(() => {
    if (!technicianId) return;

    // Subscribe to ALL changes on technician_jobs for this technician
    // We don't filter by assignment_status here - we listen to all changes
    // and refetch to get the properly filtered list from the server
    const subscription = supabase
      .channel(`technician_jobs_${technicianId}_${isHistory ? 'history' : 'current'}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'technician_jobs',
          filter: `technician_id=eq.${technicianId}`, // Filter by technician ID
        },
        (payload) => {
          console.log('Real-time update received for technician_jobs:', payload);
          // Refetch jobs when any change occurs to this technician's jobs
          // This will apply the correct status filtering on the server side
          refetch();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [technicianId, isHistory, refetch]);

  // Set up real-time subscription for jobs table (for 3rd party status updates)
  useEffect(() => {
    if (!technicianId || jobs.length === 0) return;

    // Get job IDs from current jobs list
    const jobIds = jobs.map(job => job.id);

    // Subscribe to changes on the jobs table for jobs assigned to this technician
    const subscription = supabase
      .channel(`jobs_status_${technicianId}_${isHistory ? 'history' : 'current'}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
        },
        (payload) => {
          // Check if the updated job is in our current list
          if (jobIds.includes(payload.new.id)) {
            console.log('Real-time update received for jobs table:', payload);
            refetch();
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [technicianId, isHistory, jobs, refetch]);

  return {
    jobs,
    loading,
    error,
    refetch,
  };
};

interface UseJobReturn {
  job: Job | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching a single job by ID
 *
 * @param jobId - The ID of the job to fetch
 * @returns UseJobReturn object with job data and operations
 *
 * @example
 * const { job, loading, error, refetch } = useJob('123');
 */
export const useJob = (jobId: string): UseJobReturn => {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchJob = useCallback(async () => {
    if (!jobId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await jobsService.getJobById(jobId);

      if (response.error) {
        setError(response.error);
        setJob(null);
      } else {
        setJob(response.data);
        setError(null);
      }
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to fetch job',
        details: err,
      });
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  const refetch = useCallback(async () => {
    await fetchJob();
  }, [fetchJob]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  return {
    job,
    loading,
    error,
    refetch,
  };
};
