import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Job } from '@/types';

interface NavigationContextType {
  selectedJob: Job | null;
  setSelectedJob: (job: Job | null) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  return (
    <NavigationContext.Provider value={{ selectedJob, setSelectedJob }}>
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
