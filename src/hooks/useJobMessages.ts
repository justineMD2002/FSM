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
  updateMessage: (messageId: string, messageText: string) => Promise<void>;
  deleteMessages: (messageIds: string[], deleteType: 'everyone' | 'you') => Promise<void>;
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    fetchUserId();
  }, []);

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
        // Filter out messages deleted by the current user
        const filteredMessages = (response.data || []).filter(msg => {
          if (!currentUserId) return true;
          return !msg.deleted_by_user_ids?.includes(currentUserId);
        });
        setMessages(filteredMessages);
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
  }, [jobId, currentUserId]);

  /**
   * Send a new message
   * - If imageUrl is provided, messageText goes into message_text (caption)
   * - If no imageUrl, messageText goes into message (pure text message)
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
        message: imageUrl ? null : (messageText || null), // Pure text message
        message_text: imageUrl ? (messageText || null) : null, // Image caption
        image_url: imageUrl || null,
        deleted_by_user_ids: null,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Message will be added via realtime subscription
    },
    [jobId, technicianJobId]
  );

  /**
   * Update a message (edit)
   */
  const updateMessage = useCallback(
    async (messageId: string, messageText: string) => {
      const response = await jobMessagesService.updateMessage(messageId, messageText);

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Message will be updated via realtime subscription
    },
    []
  );

  /**
   * Delete messages (supports bulk delete)
   */
  const deleteMessages = useCallback(
    async (messageIds: string[], deleteType: 'everyone' | 'you') => {
      if (!currentUserId) {
        throw new Error('User ID is required');
      }

      let response;
      if (deleteType === 'everyone') {
        // Delete for everyone
        if (messageIds.length === 1) {
          response = await jobMessagesService.deleteMessage(messageIds[0]);
        } else {
          response = await jobMessagesService.deleteMessagesBulk(messageIds);
        }
      } else {
        // Delete for current user only
        if (messageIds.length === 1) {
          response = await jobMessagesService.deleteMessageForUser(messageIds[0], currentUserId);
        } else {
          response = await jobMessagesService.deleteMessagesForUserBulk(messageIds, currentUserId);
        }
      }

      if (response.error) {
        throw new Error(response.error.message);
      }

      // For delete for everyone, real-time will handle it
      // For delete for you, we need to manually filter it out
      if (deleteType === 'you') {
        setMessages((prev) => prev.filter((msg) => !messageIds.includes(msg.id)));
      }
    },
    [currentUserId]
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
    updateMessage,
    deleteMessages,
  };
};
