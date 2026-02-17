import { useState, useEffect, useCallback } from "react";
import { SEO } from "@/components/SEO";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  Search, 
  FileText, 
  Globe, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Target,
  TrendingUp,
  BarChart3
} from "lucide-react";

type TaskStatus = "done" | "in-progress" | "todo" | "blocked";

interface SeoTask {
  task: string;
  key: string;
  status: TaskStatus;
  priority: "high" | "medium" | "low";
  notes?: string;
}

interface SeoCategory {
  title: string;
  icon: React.ElementType;
  tasks: SeoTask[];
}

const statusConfig: Record<TaskStatus, { icon: React.ElementType; color: string; label: string }> = {
  done: { icon: CheckCircle2, color: "text-green-500", label: "Done" },
  "in-progress": { icon: Clock, color: "text-yellow-500", label: "In Progress" },
  todo: { icon: Target, color: "text-muted-foreground", label: "To Do" },
  blocked: { icon: AlertTriangle, color: "text-destructive", label: "Blocked" },
};

const statusCycle: TaskStatus[] = ["todo", "in-progress", "done"];

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  low: "bg-muted text-muted-foreground border-border",
};

const defaultCategories: SeoCategory[] = [
  {
    title: "Technical SEO",
    icon: FileText,
    tasks: [
      { task: "Submit sitemap.xml to Google Search Console", key: "tech-sitemap", status: "todo", priority: "high" },
      { task: "Set up Google Search Console", key: "tech-gsc", status: "todo", priority: "high" },
      { task: "Set up Google Analytics (GA4)", key: "tech-ga4", status: "done", priority: "high", notes: "GoogleAnalytics component active" },
      { task: "Verify robots.txt is properly configured", key: "tech-robots", status: "done", priority: "high" },
      { task: "Add canonical tags to all pages", key: "tech-canonical", status: "done", priority: "medium", notes: "SEO component handles this" },
      { task: "Ensure proper viewport meta tags", key: "tech-viewport", status: "done", priority: "medium" },
      { task: "LCP optimization — preload logo", key: "tech-lcp", status: "done", priority: "medium" },
      { task: "Route-level code splitting", key: "tech-codesplit", status: "done", priority: "medium" },
      { task: "Lazy-load Web3Provider bundle", key: "tech-lazy-web3", status: "done", priority: "low" },
      { task: "Add immutable asset caching headers", key: "tech-caching", status: "todo", priority: "medium" },
    ],
  },
  {
    title: "Structured Data / Schema",
    icon: Globe,
    tasks: [
      { task: "WebApplication JSON-LD on homepage", key: "schema-webapp", status: "done", priority: "high" },
      { task: "Organization JSON-LD (ZenSolar LLC)", key: "schema-org", status: "todo", priority: "high" },
      { task: "SoftwareApplication schema", key: "schema-software", status: "todo", priority: "high" },
      { task: "FAQPage schema on How It Works", key: "schema-faq-hiw", status: "todo", priority: "high" },
      { task: "FAQPage schema on Technology page", key: "schema-faq-tech", status: "todo", priority: "medium" },
      { task: "Article schema on blog posts", key: "schema-article", status: "todo", priority: "high" },
      { task: "BreadcrumbList schema site-wide", key: "schema-breadcrumb", status: "todo", priority: "medium" },
    ],
  },
  {
    title: "Content Strategy",
    icon: Search,
    tasks: [
      { task: "Publish 12-article blog cluster", key: "content-12articles", status: "done", priority: "high", notes: "Hub-and-spoke model complete" },
      { task: "Internal cross-linking across articles", key: "content-crosslink", status: "done", priority: "high" },
      { task: "Create proof content case studies", key: "content-proof", status: "todo", priority: "high", notes: "e.g. 'Tesla owner earns 150 $ZSOLAR in 30 days'" },
      { task: "Competitor content gap analysis", key: "content-gap", status: "todo", priority: "medium", notes: "SunMine, Power Ledger, Daylight" },
      { task: "Target 'ready to buy' local keywords", key: "content-keywords", status: "todo", priority: "medium" },
      { task: "Add navigation footer on Coming Soon page linking to /blog", key: "content-footer", status: "done", priority: "high" },
    ],
  },
  {
    title: "On-Page SEO",
    icon: TrendingUp,
    tasks: [
      { task: "Title tags under 60 chars with main keyword", key: "onpage-title", status: "done", priority: "high" },
      { task: "Meta descriptions under 160 chars", key: "onpage-meta", status: "done", priority: "high" },
      { task: "Single H1 per page matching intent", key: "onpage-h1", status: "done", priority: "high" },
      { task: "Semantic HTML (header, main, section)", key: "onpage-semantic", status: "done", priority: "medium" },
      { task: "Descriptive alt attributes on images", key: "onpage-alt", status: "in-progress", priority: "medium" },
      { task: "Open Graph tags on all pages", key: "onpage-og", status: "done", priority: "medium" },
      { task: "Twitter Card tags on all pages", key: "onpage-twitter", status: "done", priority: "medium" },
    ],
  },
  {
    title: "Off-Page & Growth",
    icon: BarChart3,
    tasks: [
      { task: "Backlink strategy & outreach plan", key: "offpage-backlinks", status: "todo", priority: "medium" },
      { task: "Guest posting on clean energy blogs", key: "offpage-guest", status: "todo", priority: "low" },
      { task: "PR for patent-pending technology", key: "offpage-pr", status: "todo", priority: "medium" },
      { task: "Social media profile optimization", key: "offpage-social", status: "todo", priority: "low" },
      { task: "Monitor keyword rankings weekly", key: "offpage-rankings", status: "todo", priority: "medium" },
    ],
  },
];

export default function SeoStrategy() {
  const { isAdmin, isChecking } = useAdminCheck();
  const { user } = useAuth();
  const [categories, setCategories] = useState<SeoCategory[]>(defaultCategories);
  const [saving, setSaving] = useState<string | null>(null);

  // Load saved statuses from DB
  useEffect(() => {
    const loadStatuses = async () => {
      const { data } = await supabase
        .from('seo_tasks')
        .select('task_key, status');
      
      if (data && data.length > 0) {
        const statusMap = new Map(data.map(d => [d.task_key, d.status as TaskStatus]));
        setCategories(prev => prev.map(cat => ({
          ...cat,
          tasks: cat.tasks.map(task => ({
            ...task,
            status: statusMap.get(task.key) ?? task.status,
          })),
        })));
      }
    };
    if (isAdmin) loadStatuses();
  }, [isAdmin]);

  const cycleStatus = useCallback(async (taskKey: string) => {
    if (!user) return;
    
    // Find current status
    let currentStatus: TaskStatus = "todo";
    for (const cat of categories) {
      const task = cat.tasks.find(t => t.key === taskKey);
      if (task) { currentStatus = task.status; break; }
    }

    const currentIndex = statusCycle.indexOf(currentStatus);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];

    // Optimistic update
    setCategories(prev => prev.map(cat => ({
      ...cat,
      tasks: cat.tasks.map(task => 
        task.key === taskKey ? { ...task, status: nextStatus } : task
      ),
    })));

    setSaving(taskKey);
    const { error } = await supabase
      .from('seo_tasks')
      .upsert({
        task_key: taskKey,
        status: nextStatus,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'task_key' });

    setSaving(null);
    if (error) {
      toast.error("Failed to save status");
      // Revert
      setCategories(prev => prev.map(cat => ({
        ...cat,
        tasks: cat.tasks.map(task => 
          task.key === taskKey ? { ...task, status: currentStatus } : task
        ),
      })));
    }
  }, [categories, user]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  const allTasks = categories.flatMap(c => c.tasks);
  const done = allTasks.filter(t => t.status === "done").length;
  const inProgress = allTasks.filter(t => t.status === "in-progress").length;
  const todo = allTasks.filter(t => t.status === "todo").length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <SEO title="SEO Strategy — Admin" />
      
      <div>
        <h1 className="text-2xl font-bold text-foreground">SEO Strategy</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track and plan all SEO initiatives for zensolar.com — click any status icon to cycle it
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{allTasks.length}</p>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{done}</p>
            <p className="text-xs text-muted-foreground">Done</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{inProgress}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{todo}</p>
            <p className="text-xs text-muted-foreground">To Do</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      {categories.map((category) => (
        <Card key={category.title}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <category.icon className="h-5 w-5 text-primary" />
              {category.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {category.tasks.map((task) => {
              const config = statusConfig[task.status];
              const StatusIcon = config.icon;
              return (
                <div key={task.key} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <button
                    onClick={() => cycleStatus(task.key)}
                    className="mt-0.5 flex-shrink-0 hover:scale-125 transition-transform"
                    title={`Status: ${config.label} — click to change`}
                  >
                    {saving === task.key ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <StatusIcon className={`h-4 w-4 ${config.color}`} />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.task}</p>
                    {task.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5">{task.notes}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      <Separator />
      <div className="text-xs text-muted-foreground space-y-1">
        <p>📌 Canonical domain: <span className="font-mono">https://zensolar.com</span></p>
        <p>📌 Legal entity: ZenSolar LLC</p>
        <p>📌 Blog strategy: Hub-and-spoke topical clustering (12 initial articles)</p>
      </div>
    </div>
  );
}
