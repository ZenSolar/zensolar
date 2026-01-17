import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2 } from "lucide-react";

const categories = [
  { value: "general", label: "General Question" },
  { value: "technical", label: "Technical Issue" },
  { value: "account", label: "Account & Billing" },
  { value: "solar", label: "Solar Connection" },
  { value: "tokens", label: "Tokens & NFTs" },
  { value: "other", label: "Other" },
];

export function SupportRequestForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (subject.length > 200 || message.length > 2000) {
      toast({
        title: "Input too long",
        description: "Subject max 200 chars, message max 2000 chars",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please log in to submit a support request",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("support_requests").insert({
      user_id: user.id,
      subject: subject.trim().substring(0, 200),
      message: message.trim().substring(0, 2000),
      category,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit support request. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Request submitted",
      description: "We'll get back to you as soon as possible.",
    });
    
    setSubject("");
    setMessage("");
    setCategory("general");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full touch-target gap-2">
          <Mail className="h-4 w-4" />
          Contact Support
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm">
              <Mail className="h-5 w-5 text-primary" />
            </span>
            <span>Contact Support</span>
          </DialogTitle>
          <DialogDescription className="pt-1">
            Submit your question and we'll respond as soon as possible.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Brief description of your issue"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Describe your issue in detail..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/2000
            </p>
          </div>
          
          <Button type="submit" className="w-full gap-2 bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
