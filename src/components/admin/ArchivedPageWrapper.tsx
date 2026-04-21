import { ReactNode } from 'react';
import { ArchivedPageBanner } from './ArchivedPageBanner';

interface ArchivedPageWrapperProps {
  modelName: string;
  archivedDate: string;
  supersededBy?: string;
  reason?: string;
  children: ReactNode;
}

/**
 * Wraps any archived admin page with a sticky read-only banner so it's
 * unmistakably clear the page is a frozen historical snapshot.
 * Used in App.tsx for /admin/archive/* routes.
 */
export function ArchivedPageWrapper({
  modelName,
  archivedDate,
  supersededBy,
  reason,
  children,
}: ArchivedPageWrapperProps) {
  return (
    <div className="relative">
      <ArchivedPageBanner
        modelName={modelName}
        archivedDate={archivedDate}
        supersededBy={supersededBy}
        reason={reason}
      />
      {/* Pointer-events disabled to make read-only-ness obvious; opacity slight to reinforce */}
      <div className="opacity-95 pointer-events-auto">
        {children}
      </div>
    </div>
  );
}
