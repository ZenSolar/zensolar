import { Archive, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface ArchivedPageBannerProps {
  modelName: string;
  archivedDate: string;
  supersededBy?: string;
  reason?: string;
}

export function ArchivedPageBanner({ 
  modelName, 
  archivedDate, 
  supersededBy,
  reason 
}: ArchivedPageBannerProps) {
  return (
    <div className="sticky top-0 z-50 bg-amber-500/15 border-b-2 border-amber-500/40 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-start gap-3">
          <Archive className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-300 text-xs">
                ARCHIVED — READ ONLY
              </Badge>
              <span className="font-semibold text-sm text-amber-900 dark:text-amber-100">
                {modelName}
              </span>
            </div>
            <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
              Frozen snapshot from {archivedDate}
              {supersededBy && <> · Superseded by <span className="font-medium">{supersededBy}</span></>}
              {reason && <> · {reason}</>}
            </p>
          </div>
        </div>
        <Link 
          to="/admin/archive" 
          className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Archive Index
        </Link>
      </div>
    </div>
  );
}
