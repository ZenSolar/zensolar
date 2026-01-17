import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RotateCcw, Loader2, AlertTriangle, Sun, Car, Battery, Zap, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Category = 'solar' | 'ev_miles' | 'battery' | 'charging';

interface AdminBaselineResetProps {
  onResetComplete?: () => Promise<void>;
}

const categoryConfig: { id: Category; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'solar', label: 'Solar Energy', icon: <Sun className="h-4 w-4" />, description: 'Reset solar production baseline' },
  { id: 'ev_miles', label: 'EV Miles', icon: <Car className="h-4 w-4" />, description: 'Reset odometer baseline' },
  { id: 'battery', label: 'Battery Storage', icon: <Battery className="h-4 w-4" />, description: 'Reset battery discharge baseline' },
  { id: 'charging', label: 'EV Charging', icon: <Zap className="h-4 w-4" />, description: 'Reset charging baseline' },
];

export function AdminBaselineReset({ onResetComplete }: AdminBaselineResetProps) {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [resetResult, setResetResult] = useState<{ success: boolean; message: string; details?: any[] } | null>(null);

  const handleToggleCategory = (category: Category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === categoryConfig.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categoryConfig.map(c => c.id));
    }
  };

  const handleReset = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category to reset');
      return;
    }

    setIsResetting(true);
    setResetResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        setIsResetting(false);
        return;
      }

      const categoriesToReset = selectedCategories.length === categoryConfig.length 
        ? ['all'] 
        : selectedCategories;

      const response = await supabase.functions.invoke('reset-baselines', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { categories: categoriesToReset },
      });

      if (response.error) {
        console.error('Reset baselines error:', response.error);
        toast.error(response.error.message || 'Failed to reset baselines');
        setResetResult({ success: false, message: response.error.message || 'Failed to reset baselines' });
      } else {
        console.log('Reset result:', response.data);
        toast.success(response.data.message || 'Baselines reset successfully');
        setResetResult({
          success: true,
          message: response.data.message,
          details: response.data.details
        });
        setSelectedCategories([]);
        
        // Refresh dashboard data
        if (onResetComplete) {
          await onResetComplete();
        }
      }
    } catch (error) {
      console.error('Reset baselines exception:', error);
      toast.error('An unexpected error occurred');
      setResetResult({ success: false, message: 'An unexpected error occurred' });
    } finally {
      setIsResetting(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <>
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base text-amber-700 dark:text-amber-400">
              Admin: Reset Baselines
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Simulate a new user by resetting baselines to current lifetime values. This sets pending rewards to 0 for testing mint flows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Select categories to reset:</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs h-7 px-2"
              >
                {selectedCategories.length === categoryConfig.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {categoryConfig.map(category => (
                <div
                  key={category.id}
                  className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                    selectedCategories.includes(category.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleToggleCategory(category.id)}
                >
                  <Checkbox
                    id={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleToggleCategory(category.id)}
                  />
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {category.icon}
                    <span className="text-sm truncate">{category.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reset Result */}
          {resetResult && (
            <div className={`p-3 rounded-md text-sm ${
              resetResult.success 
                ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30' 
                : 'bg-destructive/10 text-destructive border border-destructive/30'
            }`}>
              <div className="flex items-center gap-2">
                {resetResult.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                <span>{resetResult.message}</span>
              </div>
              {resetResult.details && resetResult.details.length > 0 && (
                <div className="mt-2 pl-6 text-xs space-y-1 opacity-80">
                  {resetResult.details.map((detail, idx) => (
                    <div key={idx}>
                      • {detail.deviceType}: {detail.category} baseline set
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reset Button */}
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            disabled={selectedCategories.length === 0 || isResetting}
            onClick={() => setShowConfirmDialog(true)}
          >
            {isResetting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Selected Baselines
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Baseline Reset
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the following baselines to current lifetime values, simulating a fresh start:
              <ul className="mt-2 space-y-1 list-disc list-inside">
                {selectedCategories.map(cat => {
                  const config = categoryConfig.find(c => c.id === cat);
                  return config ? <li key={cat}>{config.label}</li> : null;
                })}
              </ul>
              <p className="mt-3 font-medium text-foreground">
                After reset, pending rewards for these categories will be 0.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Baselines'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
