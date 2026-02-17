import { SEO } from "@/components/SEO";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";

type ContentStatus = "published" | "scheduled" | "draft" | "idea";

interface ContentItem {
  title: string;
  type: "blog" | "case-study" | "social" | "email" | "video";
  status: ContentStatus;
  date?: string;
  channel?: string;
  notes?: string;
}

const statusStyles: Record<ContentStatus, { color: string; label: string }> = {
  published: { color: "bg-green-500/10 text-green-500 border-green-500/20", label: "Published" },
  scheduled: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", label: "Scheduled" },
  draft: { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", label: "Draft" },
  idea: { color: "bg-muted text-muted-foreground border-border", label: "Idea" },
};

const typeStyles: Record<string, string> = {
  blog: "bg-primary/10 text-primary",
  "case-study": "bg-secondary/10 text-secondary",
  social: "bg-purple-500/10 text-purple-500",
  email: "bg-orange-500/10 text-orange-500",
  video: "bg-red-500/10 text-red-500",
};

const contentPipeline: ContentItem[] = [
  { title: "What Is Solar Energy Blockchain Rewards?", type: "blog", status: "published", date: "2025-01", channel: "Blog" },
  { title: "How to Earn Crypto From Solar Panels", type: "blog", status: "published", date: "2025-01", channel: "Blog" },
  { title: "Proof-of-Delta™ Explained", type: "blog", status: "published", date: "2025-01", channel: "Blog" },
  { title: "Tesla Solar Panel Crypto Rewards", type: "blog", status: "published", date: "2025-01", channel: "Blog" },
  { title: "Enphase Solar Blockchain Integration", type: "blog", status: "published", date: "2025-01", channel: "Blog" },
  { title: "EV Charging Crypto Earnings", type: "blog", status: "published", date: "2025-01", channel: "Blog" },
  { title: "V2G/V2H Bidirectional Charging Hub", type: "blog", status: "published", date: "2025-01", channel: "Blog" },
  { title: "V2G Vehicle-to-Grid", type: "blog", status: "published", date: "2025-01", channel: "Blog" },
  { title: "V2H Vehicle-to-Home", type: "blog", status: "published", date: "2025-01", channel: "Blog" },
  { title: "V2X Vehicle-to-Everything", type: "blog", status: "published", date: "2025-01", channel: "Blog" },
  { title: "V2L Vehicle-to-Load", type: "blog", status: "published", date: "2025-01", channel: "Blog" },
  { title: "Virtual Power Plant (VPP)", type: "blog", status: "published", date: "2025-01", channel: "Blog" },
  { title: "Tesla Owner Earns 150 $ZSOLAR in 30 Days", type: "case-study", status: "idea", notes: "Proof content — real user data" },
  { title: "Solar + EV: Double-Dip Rewards Guide", type: "blog", status: "idea", notes: "High-intent keyword target" },
  { title: "ZenSolar vs. Traditional RECs", type: "blog", status: "idea", notes: "Competitor differentiation" },
  { title: "How Mint-on-Proof™ Works (Video Explainer)", type: "video", status: "idea", notes: "YouTube + social" },
  { title: "Weekly $ZSOLAR Digest Email", type: "email", status: "idea", notes: "Retention play" },
  { title: "Beta Launch Announcement Thread", type: "social", status: "idea", channel: "Twitter/X" },
];

export default function ContentCalendar() {
  const { isAdmin, isChecking } = useAdminCheck();

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  const published = contentPipeline.filter(c => c.status === "published").length;
  const planned = contentPipeline.filter(c => c.status !== "published").length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <SEO title="Content Calendar — Admin" />
      
      <div>
        <h1 className="text-2xl font-bold text-foreground">Content Calendar</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Plan and track all marketing content across channels
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{published}</p>
            <p className="text-xs text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{planned}</p>
            <p className="text-xs text-muted-foreground">In Pipeline</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Published ({published})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {contentPipeline.filter(c => c.status === "published").map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
              <Badge variant="outline" className={`text-[10px] ${typeStyles[item.type]}`}>{item.type}</Badge>
              <span className="text-sm text-foreground flex-1">{item.title}</span>
              {item.date && <span className="text-xs text-muted-foreground">{item.date}</span>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-yellow-500" />
            Pipeline ({planned})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {contentPipeline.filter(c => c.status !== "published").map((item, i) => {
            const style = statusStyles[item.status];
            return (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                <Badge variant="outline" className={`text-[10px] ${typeStyles[item.type]}`}>{item.type}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{item.title}</p>
                  {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                </div>
                <Badge variant="outline" className={`text-[10px] ${style.color}`}>{style.label}</Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
