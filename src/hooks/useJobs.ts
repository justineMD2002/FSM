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
  loadMore: () => Promise<void>;
  hasMore: boolean;
  loadingMore: boolean;
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
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(0);
  const user = useAuthStore((state) => state.user);

  const PAGE_SIZE = 10;

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
   * For history: shows all jobs within 6 months (regardless of assignment)
   * For current: shows only assigned jobs (ASSIGNED/STARTED status)
   * @param resetOffset - If true, resets pagination to start from beginning
   */
  const fetchJobs = useCallback(async (resetOffset: boolean = false) => {
    try {
      if (resetOffset) {
        setLoading(true);
        setOffset(0);
      }
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

      const currentOffset = resetOffset ? 0 : offset;

      let response;
      if (isHistory) {
        // For history tab: fetch ALL jobs within 6 months
        // Pass technicianId to get assignment info for each job
        response = await jobsService.getAllJobsWithinSixMonths(technicianId, PAGE_SIZE, currentOffset);
      } else {
        // For current tab: fetch only assigned jobs for this technician
        response = await jobsService.getJobsForTechnician(technicianId, isHistory, PAGE_SIZE, currentOffset);
      }

      if (response.error) {
        setError(response.error);
        if (resetOffset) {
          setJobs([]);
        }
      } else {
        const newJobs = response.data || [];

        if (resetOffset) {
          setJobs(newJobs);
        } else {
          setJobs(prev => [...prev, ...newJobs]);
        }

        // Check if there are more jobs to load
        setHasMore(newJobs.length === PAGE_SIZE);
        setError(null);
      }
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to fetch jobs',
        details: err,
      });
      if (resetOffset) {
        setJobs([]);
      }
    } finally {
      if (resetOffset) {
        setLoading(false);
      }
    }
  }, [isHistory, user?.id, technicianId, offset, PAGE_SIZE]);

  /**
   * Load more jobs (next page)
   */
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);

    try {
      if (!technicianId) return;

      let response;
      if (isHistory) {
        response = await jobsService.getAllJobsWithinSixMonths(technicianId, PAGE_SIZE, newOffset);
      } else {
        response = await jobsService.getJobsForTechnician(technicianId, isHistory, PAGE_SIZE, newOffset);
      }

      if (response.error) {
        setError(response.error);
      } else {
        const newJobs = response.data || [];
        setJobs(prev => [...prev, ...newJobs]);
        setHasMore(newJobs.length === PAGE_SIZE);
      }
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to load more jobs',
        details: err,
      });
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, offset, technicianId, isHistory, PAGE_SIZE]);

  /**
   * Refetch all jobs (reset to first page)
   */
  const refetch = useCallback(async () => {
    setOffset(0);
    setHasMore(true);
    await fetchJobs(true);
  }, [fetchJobs]);

  // Initial fetch on mount and when isHistory changes
  useEffect(() => {
    fetchJobs(true);
  }, [isHistory, technicianId]);

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

  // Set up real-time subscription for jobs table (for status updates from triggers)
  useEffect(() => {
    if (!technicianId) return;

    // Subscribe to ALL job status changes - we'll refetch to get properly filtered results
    // This is important because when a trigger updates job status to COMPLETED,
    // the job needs to move from current to history tab
    const subscription = supabase
      .channel(`jobs_status_${technicianId}_${isHistory ? 'history' : 'current'}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
        },
        async (payload) => {
          console.log('Real-time update received for jobs table:', payload);

          // Check if this job is assigned to this technician
          const { data: techJob } = await supabase
            .from('technician_jobs')
            .select('id')
            .eq('technician_id', technicianId)
            .eq('job_id', payload.new.id)
            .single();

          // If this job belongs to this technician, refetch to update the list
          if (techJob) {
            console.log(`Job ${payload.new.id} belongs to technician ${technicianId}, refetching...`);
            refetch();
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [technicianId, isHistory, refetch]);

  return {
    jobs,
    loading,
    error,
    refetch,
    loadMore,
    hasMore,
    loadingMore,
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
