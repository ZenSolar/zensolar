import { useState } from 'react';
import { MessageSquarePlus, X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function FeedbackFab() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const idempotencyKey = `feedback-${crypto.randomUUID()}`;
      const { error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'user-feedback',
          recipientEmail: 'joe@zen.solar',
          idempotencyKey,
          templateData: { message: message.trim() },
        },
      });
      if (error) throw error;
      toast({ title: 'Feedback sent!', description: 'Thanks for sharing your thoughts.' });
      setMessage('');
      setOpen(false);
    } catch {
      toast({ title: 'Something went wrong', description: 'Please try again later.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 16 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-72 rounded-xl border border-border/60 bg-card p-4 shadow-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">Send Feedback</p>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <Textarea
              placeholder="We'd love to hear your feedback! What do you like? What's confusing? What else should we have?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={1000}
              className="resize-none text-sm mb-3"
            />
            <Button
              size="sm"
              className="w-full gap-2"
              disabled={!message.trim() || sending}
              onClick={handleSubmit}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? 'Sending…' : 'Submit'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((o) => !o)}
        className="ml-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Send feedback"
      >
        {open ? <X className="h-5 w-5" /> : <MessageSquarePlus className="h-5 w-5" />}
      </motion.button>
    </div>
  );
}
