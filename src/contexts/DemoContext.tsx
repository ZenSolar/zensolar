import { createContext, useContext, ReactNode } from 'react';
import { useDemoData } from '@/hooks/useDemoData';

type DemoContextType = ReturnType<typeof useDemoData>;

const DemoContext = createContext<DemoContextType | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const demoData = useDemoData();
  return (
    <DemoContext.Provider value={demoData}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoContext() {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    throw new Error('useDemoContext must be used within a DemoProvider');
  }
  return ctx;
}
