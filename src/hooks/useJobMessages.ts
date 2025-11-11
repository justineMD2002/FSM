import { useState, useEffect, useCallback } from 'react';
import { JobTechnicianAdminMessage, ApiError } from '@/types';
import * as jobMessagesService from '@/services/jobMessages.service';
import { supabase } from '@/lib/supabase';

interface UseJobMessagesReturn {
  messages: JobTechnicianAdminMessage[];
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  sendMessage: (messageText: string, imageUrl?: string) => Promise<void>;
}

/**
 * Hook for fetching and managing job messages with realtime updates
 * @param jobId - Job ID
 * @param technicianJobId - Technician Job ID
 */
export const useJobMessages = (
  jobId: string | null,
  technicianJobId: string | null
): UseJobMessagesReturn => {
  const [messages, setMessages] = useState<JobTechnicianAdminMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  /**
   * Fetch messages from the database
   */
  const fetchMessages = useCallback(async () => {
    if (!jobId) {
      setLoading(false);
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await jobMessagesService.getMessagesByJobId(jobId);

      if (response.error) {
        setError(response.error);
        setMessages([]);
      } else {
        setMessages(response.data || []);
        setError(null);
      }
    } catch (err: any) {
      setError({
        message: err.message || 'Failed to fetch messages',
        details: err,
      });
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  /**
   * Send a new message
   */
  const sendMessage = useCallback(
    async (messageText: string, imageUrl?: string) => {
      if (!jobId || !technicianJobId) {
        throw new Error('Job ID and Technician Job ID are required');
      }

      const response = await jobMessagesService.createMessage({
        job_id: jobId,
        technician_job_id: technicianJobId,
        sender_type: 'TECHNICIAN',
        message_text: messageText || null,
        image_url: imageUrl || null,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Message will be added via realtime subscription
    },
    [jobId, technicianJobId]
  );

  /**
   * Refetch messages
   */
  const refetch = useCallback(async () => {
    await fetchMessages();
  }, [fetchMessages]);

  // Initial fetch on mount
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Set up real-time subscription
  useEffect(() => {
    if (!jobId) return;

    // Subscribe to changes on the messages table for this job
    const subscription = supabase
      .channel(`job_messages_${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'job_technician_admin_messages',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          console.log('Real-time message update:', payload);

          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as JobTechnicianAdminMessage;
            setMessages((prev) => [...prev, newMessage]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new as JobTechnicianAdminMessage;
            setMessages((prev) =>
              prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedMessage = payload.old as JobTechnicianAdminMessage;
            setMessages((prev) => prev.filter((msg) => msg.id !== deletedMessage.id));
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [jobId]);

  return {
    messages,
    loading,
    error,
    refetch,
    sendMessage,
  };
};
