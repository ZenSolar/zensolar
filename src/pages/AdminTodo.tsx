import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Mail, 
  MessageSquare, 
  Bell, 
  Shield, 
  Globe, 
  Smartphone, 
  Users, 
  Zap,
  Palette,
  HelpCircle,
  FileText,
  Lock,
  BarChart3,
  Share2,
  Accessibility,
  Languages,
  Trash2,
  Key,
  CreditCard,
  Gift,
  CheckCircle2,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SEO } from "@/components/SEO";

interface TodoItem {
  id: string;
  title: string;
  description: string;
  category: "notifications" | "auth" | "ux" | "compliance" | "growth" | "infrastructure";
  priority: "critical" | "high" | "medium" | "low";
  status: "not-started" | "in-progress" | "blocked" | "done";
  icon: React.ComponentType<{ className?: string }>;
  blockedBy?: string;
}

const initialTodos: TodoItem[] = [
  // Notifications - Critical
  {
    id: "email-notifications",
    title: "Email Notifications (Resend)",
    description: "Send email confirmations for successful mints, welcome emails, and account updates. Requires RESEND_API_KEY.",
    category: "notifications",
    priority: "critical",
    status: "blocked",
    icon: Mail,
    blockedBy: "Waiting for RESEND_API_KEY"
  },
  {
    id: "sms-notifications",
    title: "SMS/Text Notifications (Twilio)",
    description: "Optional SMS alerts for high-value mints and security events. Requires Twilio account.",
    category: "notifications",
    priority: "high",
    status: "not-started",
    icon: MessageSquare
  },
  {
    id: "push-prompt-modal",
    title: "Push Notification Prompt Modal",
    description: "Show a one-time modal on first login prompting users to enable push notifications.",
    category: "notifications",
    priority: "critical",
    status: "in-progress",
    icon: Bell
  },
  {
    id: "notification-preferences",
    title: "Granular Notification Preferences",
    description: "Let users choose which notifications they receive (mint confirmations, milestones, referrals, etc.)",
    category: "notifications",
    priority: "medium",
    status: "not-started",
    icon: Bell
  },

  // Authentication & Security
  {
    id: "embedded-wallet",
    title: "Embedded Wallet (Privy/Thirdweb/Coinbase)",
    description: "Create wallets for users automatically on signup (email/social). No seed phrases, no MetaMask needed. Users sign in → wallet is created. Research Privy ($99/mo), Thirdweb, or Coinbase Smart Wallet.",
    category: "auth",
    priority: "critical",
    status: "not-started",
    icon: Wallet
  },
  {
    id: "social-login",
    title: "Social Login (Google, Apple)",
    description: "One-click signup/login with Google and Apple OAuth providers.",
    category: "auth",
    priority: "high",
    status: "not-started",
    icon: Key
  },
  {
    id: "two-factor-auth",
    title: "Two-Factor Authentication (2FA)",
    description: "Optional TOTP-based 2FA for enhanced account security.",
    category: "auth",
    priority: "medium",
    status: "not-started",
    icon: Shield
  },
  {
    id: "session-management",
    title: "Active Sessions Management",
    description: "Let users view and revoke active sessions across devices.",
    category: "auth",
    priority: "low",
    status: "not-started",
    icon: Smartphone
  },

  // User Experience
  {
    id: "onboarding-tour",
    title: "Interactive Onboarding Tour",
    description: "Step-by-step guided tour for new users highlighting key features.",
    category: "ux",
    priority: "high",
    status: "not-started",
    icon: Zap
  },
  {
    id: "live-chat-support",
    title: "Live Chat Support Widget",
    description: "Integrate Intercom, Crisp, or similar for real-time customer support.",
    category: "ux",
    priority: "medium",
    status: "not-started",
    icon: MessageSquare
  },
  {
    id: "faq-search",
    title: "Searchable FAQ/Help Center",
    description: "Comprehensive help documentation with search functionality.",
    category: "ux",
    priority: "medium",
    status: "not-started",
    icon: HelpCircle
  },
  {
    id: "accessibility-audit",
    title: "Accessibility (a11y) Audit",
    description: "WCAG 2.1 AA compliance review and fixes for screen readers, keyboard nav, etc.",
    category: "ux",
    priority: "medium",
    status: "not-started",
    icon: Accessibility
  },
  {
    id: "multi-language",
    title: "Multi-Language Support (i18n)",
    description: "Internationalization for Spanish, French, German, and other languages.",
    category: "ux",
    priority: "low",
    status: "not-started",
    icon: Languages
  },
  {
    id: "native-app",
    title: "Native Mobile App (iOS/Android)",
    description: "Deploy as native apps via Capacitor for App Store and Play Store.",
    category: "ux",
    priority: "low",
    status: "not-started",
    icon: Smartphone
  },

  // Compliance & Trust
  {
    id: "gdpr-data-export",
    title: "GDPR Data Export",
    description: "Allow users to download all their personal data in a portable format.",
    category: "compliance",
    priority: "high",
    status: "not-started",
    icon: FileText
  },
  {
    id: "account-deletion",
    title: "Account Deletion",
    description: "Self-service account deletion with data purge confirmation.",
    category: "compliance",
    priority: "high",
    status: "not-started",
    icon: Trash2
  },
  {
    id: "cookie-consent",
    title: "Cookie Consent Banner",
    description: "GDPR-compliant cookie consent with granular tracking preferences.",
    category: "compliance",
    priority: "medium",
    status: "not-started",
    icon: Lock
  },

  // Growth & Engagement
  {
    id: "referral-rewards",
    title: "Enhanced Referral Rewards",
    description: "Tiered referral bonuses and leaderboards for top referrers.",
    category: "growth",
    priority: "high",
    status: "not-started",
    icon: Gift
  },
  {
    id: "social-sharing",
    title: "Social Sharing Features",
    description: "One-click share to Twitter/X, LinkedIn, Facebook with custom OG images.",
    category: "growth",
    priority: "medium",
    status: "not-started",
    icon: Share2
  },
  {
    id: "user-analytics",
    title: "Personal Analytics Dashboard",
    description: "Show users their own stats: total energy, tokens earned, carbon offset, etc.",
    category: "growth",
    priority: "medium",
    status: "not-started",
    icon: BarChart3
  },
  {
    id: "gamification",
    title: "Gamification & Achievements",
    description: "Badges, streaks, and milestones beyond NFTs to boost engagement.",
    category: "growth",
    priority: "low",
    status: "not-started",
    icon: CheckCircle2
  },

  // Infrastructure
  {
    id: "rate-limiting",
    title: "Rate Limiting & Abuse Protection",
    description: "Protect APIs from abuse with rate limiting and anomaly detection.",
    category: "infrastructure",
    priority: "high",
    status: "not-started",
    icon: Shield
  },
  {
    id: "stripe-payments",
    title: "Stripe Payments Integration",
    description: "Accept fiat payments for store purchases and premium features.",
    category: "infrastructure",
    priority: "medium",
    status: "not-started",
    icon: CreditCard
  },
  {
    id: "error-tracking",
    title: "Error Tracking (Sentry)",
    description: "Real-time error monitoring and crash reporting for production issues.",
    category: "infrastructure",
    priority: "medium",
    status: "not-started",
    icon: Zap
  },
];

const categoryLabels = {
  notifications: { label: "Notifications", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  auth: { label: "Auth & Security", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  ux: { label: "User Experience", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  compliance: { label: "Compliance", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  growth: { label: "Growth", color: "bg-pink-500/10 text-pink-500 border-pink-500/20" },
  infrastructure: { label: "Infrastructure", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
};

const priorityLabels = {
  critical: { label: "Critical", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  high: { label: "High", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  medium: { label: "Medium", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  low: { label: "Low", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
};

const statusLabels = {
  "not-started": { label: "Not Started", color: "bg-muted text-muted-foreground" },
  "in-progress": { label: "In Progress", color: "bg-blue-500/10 text-blue-500" },
  "blocked": { label: "Blocked", color: "bg-red-500/10 text-red-500" },
  "done": { label: "Done", color: "bg-green-500/10 text-green-500" },
};

export default function AdminTodo() {
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos);
  const [filter, setFilter] = useState<string>("all");

  const toggleStatus = (id: string) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === id) {
        const newStatus = todo.status === "done" ? "not-started" : "done";
        return { ...todo, status: newStatus };
      }
      return todo;
    }));
  };

  const filteredTodos = filter === "all" 
    ? todos 
    : todos.filter(t => t.category === filter || t.priority === filter || t.status === filter);

  const stats = {
    total: todos.length,
    done: todos.filter(t => t.status === "done").length,
    inProgress: todos.filter(t => t.status === "in-progress").length,
    blocked: todos.filter(t => t.status === "blocked").length,
    critical: todos.filter(t => t.priority === "critical" && t.status !== "done").length,
  };

  const groupedTodos = {
    critical: filteredTodos.filter(t => t.priority === "critical"),
    high: filteredTodos.filter(t => t.priority === "high"),
    medium: filteredTodos.filter(t => t.priority === "medium"),
    low: filteredTodos.filter(t => t.priority === "low"),
  };

  return (
    <>
      <SEO title="Implementation To-Do | Admin" />
      
      <div className="container mx-auto p-4 md:p-6 max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Implementation To-Do</h1>
          <p className="text-muted-foreground mt-1">
            Track features needed for a world-class customer experience
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Items</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-500">{stats.done}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-500">{stats.inProgress}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-red-500">{stats.blocked}</div>
            <div className="text-xs text-muted-foreground">Blocked</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-orange-500">{stats.critical}</div>
            <div className="text-xs text-muted-foreground">Critical Pending</div>
          </Card>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant={filter === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilter("all")}
          >
            All
          </Badge>
          {Object.entries(categoryLabels).map(([key, { label }]) => (
            <Badge 
              key={key}
              variant={filter === key ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilter(key)}
            >
              {label}
            </Badge>
          ))}
          <Badge 
            variant={filter === "blocked" ? "destructive" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilter("blocked")}
          >
            Blocked
          </Badge>
        </div>

        {/* Todo Lists by Priority */}
        {Object.entries(groupedTodos).map(([priority, items]) => {
          if (items.length === 0) return null;
          const priorityInfo = priorityLabels[priority as keyof typeof priorityLabels];
          
          return (
            <Card key={priority}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Badge className={priorityInfo.color}>{priorityInfo.label} Priority</Badge>
                  <span className="text-muted-foreground text-sm font-normal">
                    ({items.filter(i => i.status === "done").length}/{items.length} complete)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((todo) => {
                  const Icon = todo.icon;
                  const categoryInfo = categoryLabels[todo.category];
                  const statusInfo = statusLabels[todo.status];
                  
                  return (
                    <div 
                      key={todo.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                        todo.status === "done" && "opacity-60 bg-muted/30"
                      )}
                    >
                      <Checkbox
                        checked={todo.status === "done"}
                        onCheckedChange={() => toggleStatus(todo.id)}
                        className="mt-1"
                      />
                      <Icon className={cn(
                        "h-5 w-5 mt-0.5 flex-shrink-0",
                        todo.status === "done" ? "text-muted-foreground" : "text-primary"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            "font-medium",
                            todo.status === "done" && "line-through"
                          )}>
                            {todo.title}
                          </span>
                          <Badge variant="outline" className={cn("text-xs", categoryInfo.color)}>
                            {categoryInfo.label}
                          </Badge>
                          <Badge variant="outline" className={cn("text-xs", statusInfo.color)}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {todo.description}
                        </p>
                        {todo.blockedBy && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {todo.blockedBy}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
