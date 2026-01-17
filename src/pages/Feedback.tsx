import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Loader2, 
  MessageSquarePlus, 
  Send, 
  CheckCircle2, 
  Bug, 
  Lightbulb, 
  TrendingUp,
  MessageCircle,
  Sparkles
} from 'lucide-react';

const categories = [
  { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-500', bg: 'bg-red-500/10' },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { value: 'improvement', label: 'Improvement', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
  { value: 'general', label: 'General Feedback', icon: MessageCircle, color: 'text-secondary', bg: 'bg-secondary/10' },
];

export default function Feedback() {
  const { user } = useAuth();
  const [category, setCategory] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to submit feedback');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('feedback').insert({
        user_id: user.id,
        category,
        subject: subject.trim(),
        message: message.trim(),
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewFeedback = () => {
    setSubmitted(false);
    setCategory('general');
    setSubject('');
    setMessage('');
  };

  const selectedCategory = categories.find(c => c.value === category);

  if (submitted) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="overflow-hidden border-primary/20">
            <CardContent className="pt-16 pb-12 text-center space-y-6">
              <motion.div 
                className="relative inline-flex"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <div className="relative p-5 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
                  <CheckCircle2 className="h-12 w-12 text-primary" />
                </div>
              </motion.div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Thank You!</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your feedback has been submitted successfully. We appreciate you taking the time to help improve ZenSolar.
                </p>
              </div>
              
              <Button onClick={handleNewFeedback} className="mt-6 gap-2">
                <MessageSquarePlus className="h-4 w-4" />
                Submit More Feedback
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
          <MessageSquarePlus className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Beta Feedback</h1>
          <p className="text-muted-foreground">Help us improve ZenSolar with your suggestions</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Share Your Thoughts</CardTitle>
                <CardDescription>Your feedback shapes the future of ZenSolar</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selection */}
              <div className="space-y-3">
                <Label className="text-base">What type of feedback?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`relative p-4 rounded-xl border text-left transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                            : 'border-border hover:border-primary/50 hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${cat.bg}`}>
                            <Icon className={`h-5 w-5 ${cat.color}`} />
                          </div>
                          <span className="font-medium">{cat.label}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-base">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief summary of your feedback"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-12"
                  maxLength={100}
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-base">Details</Label>
                <Textarea
                  id="message"
                  placeholder="Describe your feedback, suggestion, or issue in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[180px] resize-none"
                  maxLength={2000}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Be as specific as possible</span>
                  <span>{message.length}/2000</span>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base gap-2" 
                disabled={isSubmitting || !subject.trim() || !message.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}