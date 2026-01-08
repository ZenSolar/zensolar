import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface EnphaseCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (code: string) => Promise<boolean>;
}

export function EnphaseCodeDialog({ open, onOpenChange, onSubmit }: EnphaseCodeDialogProps) {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    setIsSubmitting(true);
    const success = await onSubmit(code.trim());
    setIsSubmitting(false);
    
    if (success) {
      setCode('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Enphase Authorization Code</DialogTitle>
          <DialogDescription>
            After authorizing in the Enphase window, copy the authorization code displayed and paste it below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="enphase-code">Authorization Code</Label>
              <Input
                id="enphase-code"
                placeholder="Paste your authorization code here"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!code.trim() || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
