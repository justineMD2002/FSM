import { create } from 'zustand';
import { JobTask, Followup, JobImage } from '@/types';

// Extended types with temporary fields
interface DraftTask extends JobTask {
  isNew?: boolean;
}

interface DraftFollowup extends Omit<Followup, 'technician'> {
  isNew?: boolean;
}

interface DraftImage extends JobImage {
  isNew?: boolean;
  localUri?: string;
  fileExtension?: string;
}

// Draft data for a specific job
interface JobServiceDraft {
  tasks: DraftTask[];
  followups: DraftFollowup[];
  images: DraftImage[];
}

interface ServiceTabState {
  // Store drafts by jobId
  drafts: Record<string, JobServiceDraft>;

  // Get draft for a specific job
  getDraft: (jobId: string) => JobServiceDraft;

  // Save draft for a specific job
  saveDraft: (jobId: string, draft: JobServiceDraft) => void;

  // Clear draft for a specific job (after successful submission)
  clearDraft: (jobId: string) => void;

  // Clear all drafts
  clearAllDrafts: () => void;
}

const emptyDraft: JobServiceDraft = {
  tasks: [],
  followups: [],
  images: [],
};

export const useServiceTabStore = create<ServiceTabState>((set, get) => ({
  drafts: {},

  getDraft: (jobId: string) => {
    const drafts = get().drafts;
    return drafts[jobId] || emptyDraft;
  },

  saveDraft: (jobId: string, draft: JobServiceDraft) => {
    set((state) => ({
      drafts: {
        ...state.drafts,
        [jobId]: draft,
      },
    }));
  },

  clearDraft: (jobId: string) => {
    set((state) => {
      const newDrafts = { ...state.drafts };
      delete newDrafts[jobId];
      return { drafts: newDrafts };
    });
  },

  clearAllDrafts: () => {
    set({ drafts: {} });
  },
}));
