import { useViewAsUser } from '@/contexts/ViewAsUserContext';
import { Button } from '@/components/ui/button';
import { Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Floating banner displayed when admin is viewing as another user.
 * Shows who they're viewing as and provides a quick exit.
 */
export function ViewAsUserBanner() {
  const { isViewingAsOther, targetDisplayName, targetEmail, stopViewingAs } = useViewAsUser();
  const navigate = useNavigate();

  if (!isViewingAsOther) return null;

  const displayLabel = targetDisplayName || targetEmail || 'Unknown User';

  const handleExit = () => {
    stopViewingAs();
    navigate('/admin/users');
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 bg-solar text-solar-foreground px-4 py-2 rounded-full shadow-lg border border-solar/50">
        <Eye className="h-4 w-4" />
        <span className="text-sm font-medium">
          Viewing as: <span className="font-bold">{displayLabel}</span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExit}
          className="h-7 px-2 hover:bg-solar-foreground/20 text-solar-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Exit
        </Button>
      </div>
    </div>
  );
}
