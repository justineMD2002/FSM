import { useState, useEffect, useCallback } from 'react';
import { ApiError, TechnicianJob, Equipment, Contact, JobTask, TaskCompletion, Followup, JobEquipment, JobSignature } from '@/types';
import * as technicianJobsService from '@/services/technicianJobs.service';
import * as equipmentsService from '@/services/equipments.service';
import * as contactsService from '@/services/contacts.service';
import * as jobTasksService from '@/services/jobTasks.service';
import * as followupsService from '@/services/followups.service';
import * as jobSignaturesService from '@/services/jobSignatures.service';

/**
 * Hook for fetching technicians assigned to a job
 */
export const useJobTechnicians = (jobId: string) => {
  const [technicians, setTechnicians] = useState<TechnicianJob[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchTechnicians = useCallback(async () => {
    if (!jobId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await technicianJobsService.getTechniciansByJobId(jobId);

      if (response.error) {
        setError(response.error);
        setTechnicians([]);
      } else {
        setTechnicians(response.data || []);
        setError(null);
      }
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to fetch technicians',
        details: err,
      });
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  return {
    technicians,
    loading,
    error,
    refetch: fetchTechnicians,
  };
};

/**
 * Hook for fetching customer equipments
 */
export const useCustomerEquipments = (customerId: string) => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchEquipments = useCallback(async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await equipmentsService.getEquipmentsByCustomerId(customerId);

      if (response.error) {
        setError(response.error);
        setEquipments([]);
      } else {
        setEquipments(response.data || []);
        setError(null);
      }
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to fetch equipments',
        details: err,
      });
      setEquipments([]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchEquipments();
  }, [fetchEquipments]);

  return {
    equipments,
    loading,
    error,
    refetch: fetchEquipments,
  };
};

/**
 * Hook for fetching job equipments
 */
export const useJobEquipments = (jobId: string) => {
  const [jobEquipments, setJobEquipments] = useState<JobEquipment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchJobEquipments = useCallback(async () => {
    if (!jobId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await equipmentsService.getJobEquipmentsByJobId(jobId);

      if (response.error) {
        setError(response.error);
        setJobEquipments([]);
      } else {
        setJobEquipments(response.data || []);
        setError(null);
      }
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to fetch job equipments',
        details: err,
      });
      setJobEquipments([]);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJobEquipments();
  }, [fetchJobEquipments]);

  return {
    jobEquipments,
    loading,
    error,
    refetch: fetchJobEquipments,
  };
};

/**
 * Hook for fetching customer contacts
 */
export const useCustomerContacts = (customerId: string) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchContacts = useCallback(async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await contactsService.getContactsByCustomerId(customerId);

      if (response.error) {
        setError(response.error);
        setContacts([]);
      } else {
        setContacts(response.data || []);
        setError(null);
      }
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to fetch contacts',
        details: err,
      });
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    loading,
    error,
    refetch: fetchContacts,
  };
};

/**
 * Hook for fetching job tasks
 */
export const useJobTasks = (jobId: string) => {
  const [tasks, setTasks] = useState<JobTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!jobId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await jobTasksService.getTasksByJobId(jobId);

      if (response.error) {
        setError(response.error);
        setTasks([]);
      } else {
        setTasks(response.data || []);
        setError(null);
      }
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to fetch tasks',
        details: err,
      });
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
  };
};

/**
 * Hook for fetching task completions
 */
export const useTaskCompletions = (technicianJobId: string | null) => {
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchCompletions = useCallback(async () => {
    if (!technicianJobId) {
      setLoading(false);
      setCompletions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await jobTasksService.getTaskCompletionsByTechnicianJobId(technicianJobId);

      if (response.error) {
        setError(response.error);
        setCompletions([]);
      } else {
        setCompletions(response.data || []);
        setError(null);
      }
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to fetch task completions',
        details: err,
      });
      setCompletions([]);
    } finally {
      setLoading(false);
    }
  }, [technicianJobId]);

  useEffect(() => {
    fetchCompletions();
  }, [fetchCompletions]);

  return {
    completions,
    loading,
    error,
    refetch: fetchCompletions,
  };
};

/**
 * Hook for fetching job followups
 */
export const useJobFollowups = (jobId: string) => {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchFollowups = useCallback(async () => {
    if (!jobId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await followupsService.getFollowupsByJobId(jobId);

      if (response.error) {
        setError(response.error);
        setFollowups([]);
      } else {
        setFollowups(response.data || []);
        setError(null);
      }
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to fetch followups',
        details: err,
      });
      setFollowups([]);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchFollowups();
  }, [fetchFollowups]);

  return {
    followups,
    loading,
    error,
    refetch: fetchFollowups,
  };
};

/**
 * Hook for fetching job signature
 */
export const useJobSignature = (technicianJobId: string | null) => {
  const [signature, setSignature] = useState<JobSignature | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchSignature = useCallback(async () => {
    if (!technicianJobId) {
      setLoading(false);
      setSignature(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await jobSignaturesService.getJobSignatureByTechnicianJobId(technicianJobId);

      if (response.error) {
        setError(response.error);
        setSignature(null);
      } else {
        setSignature(response.data);
        setError(null);
      }
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to fetch signature',
        details: err,
      });
      setSignature(null);
    } finally {
      setLoading(false);
    }
  }, [technicianJobId]);

  useEffect(() => {
    fetchSignature();
  }, [fetchSignature]);

  return {
    signature,
    loading,
    error,
    refetch: fetchSignature,
  };
};

/**
 * Hook for getting current user's technician job
 */
export const useCurrentUserTechnicianJob = (jobId: string, userId: string | null) => {
  const [technicianJob, setTechnicianJob] = useState<TechnicianJob | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchTechnicianJob = useCallback(async () => {
    if (!jobId || !userId) {
      setLoading(false);
      setTechnicianJob(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await technicianJobsService.getCurrentUserTechnicianJob(jobId, userId);

      if (response.error) {
        setError(response.error);
        setTechnicianJob(null);
      } else {
        setTechnicianJob(response.data);
        setError(null);
      }
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to fetch technician job',
        details: err,
      });
      setTechnicianJob(null);
    } finally {
      setLoading(false);
    }
  }, [jobId, userId]);

  useEffect(() => {
    fetchTechnicianJob();
  }, [fetchTechnicianJob]);

  return {
    technicianJob,
    loading,
    error,
    refetch: fetchTechnicianJob,
  };
};
