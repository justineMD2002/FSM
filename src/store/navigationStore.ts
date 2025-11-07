import { create } from 'zustand';
import { Job } from '@/types';
import { Tab } from '@/enums';

interface NavigationState {
  // Job navigation
  selectedJob: Job | null;
  setSelectedJob: (job: Job | null) => void;

  // Map view
  showMapView: boolean;
  setShowMapView: (show: boolean) => void;

  // Active tab
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  // Job navigation
  selectedJob: null,
  setSelectedJob: (job) => set({ selectedJob: job }),

  // Map view
  showMapView: false,
  setShowMapView: (show) => set({ showMapView: show }),

  // Active tab - default to PROFILE as per MainScreen
  activeTab: Tab.PROFILE,
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
