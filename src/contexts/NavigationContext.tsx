import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Job } from '@/types';

interface NavigationContextType {
  selectedJob: Job | null;
  setSelectedJob: (job: Job | null) => void;
  showMapView: boolean;
  setShowMapView: (show: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showMapView, setShowMapView] = useState(false);

  return (
    <NavigationContext.Provider value={{ selectedJob, setSelectedJob, showMapView, setShowMapView }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
