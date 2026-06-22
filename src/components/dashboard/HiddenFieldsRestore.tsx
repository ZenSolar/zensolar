import { Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { HideableField } from '@/hooks/useHiddenActivityFields';

// Human-readable labels for hidden fields
const fieldLabels: Record<HideableField, string> = {
  solar: 'Solar Energy',
  ev_miles: 'EV Miles',
  battery: 'Battery',
  charging: 'EV Charging',
  supercharger: 'Supercharger',
  home_charger: 'Home Charging',
};

interface HiddenFieldsRestoreProps {
  hiddenFields: HideableField[];
  onShowField: (field: HideableField) => void;
  onShowAll: () => void;
}

export function HiddenFieldsRestore({ 
  hiddenFields, 
  onShowField, 
  onShowAll 
}: HiddenFieldsRestoreProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (hiddenFields.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-2"
      >
        <Eye className="h-4 w-4" />
        <span>
          {hiddenFields.length} hidden field{hiddenFields.length > 1 ? 's' : ''}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-2">
              <div className="flex flex-wrap gap-2">
                {hiddenFields.map((field) => (
                  <button
                    key={field}
                    onClick={() => onShowField(field)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                      "bg-muted hover:bg-primary/10 border border-border/50 hover:border-primary/30",
                      "transition-all text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Eye className="h-3 w-3" />
                    {fieldLabels[field]}
                  </button>
                ))}
              </div>
              
              {hiddenFields.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShowAll}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  Restore all fields
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
