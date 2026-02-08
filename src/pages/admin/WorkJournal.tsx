import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { Plus, Trash2, Calendar, Loader2, BookOpen, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'feature', label: 'Feature', color: 'bg-primary/10 text-primary border-primary/20' },
  { value: 'bugfix', label: 'Bug Fix', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  { value: 'ui', label: 'UI/UX', color: 'bg-secondary/10 text-secondary border-secondary/20' },
  { value: 'refactor', label: 'Refactor', color: 'bg-accent-foreground/10 text-accent-foreground border-accent-foreground/20' },
  { value: 'infrastructure', label: 'Infrastructure', color: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20' },
  { value: 'security', label: 'Security', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  { value: 'database', label: 'Database', color: 'bg-primary/10 text-primary border-primary/20' },
  { value: 'admin', label: 'Admin', color: 'bg-solar/10 text-solar border-solar/20' },
];

function getCategoryStyle(cat: string) {
  return CATEGORIES.find(c => c.value === cat)?.color || 'bg-muted text-muted-foreground';
}

function getCategoryLabel(cat: string) {
  return CATEGORIES.find(c => c.value === cat)?.label || cat;
}

interface JournalEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
  created_by: string;
}

export default function WorkJournal() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('feature');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['work-journal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_journal')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as JournalEntry[];
    },
  });

  const { data: summaries = [] } = useQuery({
    queryKey: ['work-journal-summaries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_journal_summaries')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data as { id: string; date: string; summary: string }[];
    },
  });

  const summaryMap = summaries.reduce<Record<string, string>>((acc, s) => {
    acc[s.date] = s.summary;
    return acc;
  }, {});

  const addEntry = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('work_journal').insert({
        title,
        description,
        category,
        date,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-journal'] });
      toast.success('Entry added');
      setTitle('');
      setDescription('');
      setCategory('feature');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('work_journal').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-journal'] });
      toast.success('Entry deleted');
    },
  });

  // Group entries by date
  const grouped = entries.reduce<Record<string, JournalEntry[]>>((acc, entry) => {
    const key = entry.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="bg-background min-h-full w-full max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Work Journal</h1>
            <p className="text-sm text-muted-foreground">Track daily progress, changes & implementations</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Journal Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="What was done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                placeholder="Details, files changed, decisions made..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={() => addEntry.mutate()}
                disabled={!title.trim() || !description.trim() || addEntry.isPending}
                className="w-full"
              >
                {addEntry.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Entry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-sm text-muted-foreground">
        <span>{entries.length} entries</span>
        <span>·</span>
        <span>{sortedDates.length} days logged</span>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sortedDates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No journal entries yet. Add your first entry to start tracking progress.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(dateKey => (
            <div key={dateKey}>
              <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background py-1 z-10">
                <Calendar className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  {format(parseISO(dateKey), 'EEEE, MMMM d, yyyy')}
                </h2>
                <Badge variant="outline" className="text-xs">{grouped[dateKey].length}</Badge>
              </div>
              {/* Daily narrative summary */}
              {summaryMap[dateKey] && (
                <div className="mb-3 ml-2 border-l-2 border-primary/30 pl-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FileText className="h-3 w-3 text-primary/60" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-primary/60">Daily Summary</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">{summaryMap[dateKey]}</p>
                </div>
              )}
              <div className="space-y-2 ml-2 border-l-2 border-border pl-4">
                {grouped[dateKey].map(entry => (
                  <Card key={entry.id} className="group">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-[10px] ${getCategoryStyle(entry.category)}`}>
                              {getCategoryLabel(entry.category)}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(entry.created_at), 'h:mm a')}
                            </span>
                          </div>
                          <h3 className="text-sm font-medium text-foreground">{entry.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{entry.description}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                          onClick={() => deleteEntry.mutate(entry.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
