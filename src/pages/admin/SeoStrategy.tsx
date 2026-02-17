import { SEO } from "@/components/SEO";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  FileText, 
  Globe, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  Target,
  TrendingUp,
  BarChart3
} from "lucide-react";

type TaskStatus = "done" | "in-progress" | "todo" | "blocked";

interface SeoTask {
  task: string;
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

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  low: "bg-muted text-muted-foreground border-border",
};

const seoCategories: SeoCategory[] = [
  {
    title: "Technical SEO",
    icon: FileText,
    tasks: [
      { task: "Submit sitemap.xml to Google Search Console", status: "todo", priority: "high" },
      { task: "Set up Google Search Console", status: "todo", priority: "high" },
      { task: "Set up Google Analytics (GA4)", status: "done", priority: "high", notes: "GoogleAnalytics component active" },
      { task: "Verify robots.txt is properly configured", status: "done", priority: "high" },
      { task: "Add canonical tags to all pages", status: "done", priority: "medium", notes: "SEO component handles this" },
      { task: "Ensure proper viewport meta tags", status: "done", priority: "medium" },
      { task: "LCP optimization — preload logo", status: "done", priority: "medium" },
      { task: "Route-level code splitting", status: "done", priority: "medium" },
      { task: "Lazy-load Web3Provider bundle", status: "done", priority: "low" },
      { task: "Add immutable asset caching headers", status: "todo", priority: "medium" },
    ],
  },
  {
    title: "Structured Data / Schema",
    icon: Globe,
    tasks: [
      { task: "WebApplication JSON-LD on homepage", status: "done", priority: "high" },
      { task: "Organization JSON-LD (ZenSolar LLC)", status: "todo", priority: "high" },
      { task: "SoftwareApplication schema", status: "todo", priority: "high" },
      { task: "FAQPage schema on How It Works", status: "todo", priority: "high" },
      { task: "FAQPage schema on Technology page", status: "todo", priority: "medium" },
      { task: "Article schema on blog posts", status: "todo", priority: "high" },
      { task: "BreadcrumbList schema site-wide", status: "todo", priority: "medium" },
    ],
  },
  {
    title: "Content Strategy",
    icon: Search,
    tasks: [
      { task: "Publish 12-article blog cluster", status: "done", priority: "high", notes: "Hub-and-spoke model complete" },
      { task: "Internal cross-linking across articles", status: "done", priority: "high" },
      { task: "Create proof content case studies", status: "todo", priority: "high", notes: "e.g. 'Tesla owner earns 150 $ZSOLAR in 30 days'" },
      { task: "Competitor content gap analysis", status: "todo", priority: "medium", notes: "SunMine, Power Ledger, Daylight" },
      { task: "Target 'ready to buy' local keywords", status: "todo", priority: "medium" },
      { task: "Add navigation footer on Coming Soon page linking to /blog", status: "done", priority: "high" },
    ],
  },
  {
    title: "On-Page SEO",
    icon: TrendingUp,
    tasks: [
      { task: "Title tags under 60 chars with main keyword", status: "done", priority: "high" },
      { task: "Meta descriptions under 160 chars", status: "done", priority: "high" },
      { task: "Single H1 per page matching intent", status: "done", priority: "high" },
      { task: "Semantic HTML (header, main, section)", status: "done", priority: "medium" },
      { task: "Descriptive alt attributes on images", status: "in-progress", priority: "medium" },
      { task: "Open Graph tags on all pages", status: "done", priority: "medium" },
      { task: "Twitter Card tags on all pages", status: "done", priority: "medium" },
    ],
  },
  {
    title: "Off-Page & Growth",
    icon: BarChart3,
    tasks: [
      { task: "Backlink strategy & outreach plan", status: "todo", priority: "medium" },
      { task: "Guest posting on clean energy blogs", status: "todo", priority: "low" },
      { task: "PR for patent-pending technology", status: "todo", priority: "medium" },
      { task: "Social media profile optimization", status: "todo", priority: "low" },
      { task: "Monitor keyword rankings weekly", status: "todo", priority: "medium" },
    ],
  },
];

export default function SeoStrategy() {
  const { isAdmin } = useAdminCheck();
  if (!isAdmin) return <Navigate to="/" replace />;

  const allTasks = seoCategories.flatMap(c => c.tasks);
  const done = allTasks.filter(t => t.status === "done").length;
  const inProgress = allTasks.filter(t => t.status === "in-progress").length;
  const todo = allTasks.filter(t => t.status === "todo").length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <SEO title="SEO Strategy — Admin" />
      
      <div>
        <h1 className="text-2xl font-bold text-foreground">SEO Strategy</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track and plan all SEO initiatives for zensolar.com
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
      {seoCategories.map((category) => (
        <Card key={category.title}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <category.icon className="h-5 w-5 text-primary" />
              {category.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {category.tasks.map((task, i) => {
              const config = statusConfig[task.status];
              const StatusIcon = config.icon;
              return (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <StatusIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{task.task}</p>
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
