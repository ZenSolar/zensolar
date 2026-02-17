import { SEO } from "@/components/SEO";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Eye, FileText, Link2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlogArticle {
  title: string;
  slug: string;
  cluster: string;
  hasSchema: boolean;
  internalLinks: number;
  status: "live" | "draft";
}

const articles: BlogArticle[] = [
  { title: "What Is Solar Energy Blockchain Rewards?", slug: "/blog/what-is-solar-energy-blockchain-rewards", cluster: "Core", hasSchema: false, internalLinks: 3, status: "live" },
  { title: "How to Earn Crypto From Solar Panels", slug: "/blog/how-to-earn-crypto-from-solar-panels", cluster: "Core", hasSchema: false, internalLinks: 4, status: "live" },
  { title: "Proof-of-Delta™ Explained", slug: "/blog/proof-of-delta-explained", cluster: "Core", hasSchema: false, internalLinks: 3, status: "live" },
  { title: "Tesla Solar Panel Crypto Rewards", slug: "/blog/tesla-solar-panel-crypto-rewards", cluster: "Core", hasSchema: false, internalLinks: 3, status: "live" },
  { title: "Enphase Solar Blockchain", slug: "/blog/enphase-solar-blockchain", cluster: "Core", hasSchema: false, internalLinks: 3, status: "live" },
  { title: "EV Charging Crypto Earnings", slug: "/blog/ev-charging-crypto-earnings", cluster: "Core", hasSchema: false, internalLinks: 3, status: "live" },
  { title: "V2G/V2H Bidirectional Charging (Hub)", slug: "/blog/v2g-v2h-bidirectional-ev-charging", cluster: "V2G Hub", hasSchema: false, internalLinks: 5, status: "live" },
  { title: "V2G Vehicle-to-Grid", slug: "/blog/v2g-vehicle-to-grid", cluster: "V2G Spoke", hasSchema: false, internalLinks: 3, status: "live" },
  { title: "V2H Vehicle-to-Home", slug: "/blog/v2h-vehicle-to-home", cluster: "V2G Spoke", hasSchema: false, internalLinks: 3, status: "live" },
  { title: "V2X Vehicle-to-Everything", slug: "/blog/v2x-vehicle-to-everything", cluster: "V2G Spoke", hasSchema: false, internalLinks: 3, status: "live" },
  { title: "V2L Vehicle-to-Load", slug: "/blog/v2l-vehicle-to-load", cluster: "V2G Spoke", hasSchema: false, internalLinks: 3, status: "live" },
  { title: "Virtual Power Plant (VPP)", slug: "/blog/virtual-power-plant-vpp", cluster: "V2G Spoke", hasSchema: false, internalLinks: 3, status: "live" },
];

export default function BlogManager() {
  const { isAdmin } = useAdminCheck();
  if (!isAdmin) return <Navigate to="/" replace />;

  const liveCount = articles.filter(a => a.status === "live").length;
  const withSchema = articles.filter(a => a.hasSchema).length;
  const avgLinks = Math.round(articles.reduce((sum, a) => sum + a.internalLinks, 0) / articles.length);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <SEO title="Blog Manager — Admin" />
      
      <div>
        <h1 className="text-2xl font-bold text-foreground">Blog Manager</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage published articles, schema markup, and internal linking
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{articles.length}</p>
            <p className="text-xs text-muted-foreground">Total Articles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{liveCount}</p>
            <p className="text-xs text-muted-foreground">Live</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{withSchema}/{articles.length}</p>
            <p className="text-xs text-muted-foreground">Have Schema</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{avgLinks}</p>
            <p className="text-xs text-muted-foreground">Avg Internal Links</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Published Articles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {articles.map((article, i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{article.title}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{article.slug}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[10px]">{article.cluster}</Badge>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Link2 className="h-3 w-3" /> {article.internalLinks} links
                    </span>
                    {article.hasSchema ? (
                      <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20">
                        <Search className="h-3 w-3 mr-1" /> Schema ✓
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">
                        No Schema
                      </Badge>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a href={article.slug} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">SEO Action Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>⚠️ <strong className="text-foreground">0/{articles.length}</strong> articles have Article JSON-LD schema — add to all posts</p>
          <p>🔗 Ensure every article links to at least 3 other internal pages</p>
          <p>📊 Set up rank tracking for target keywords per article</p>
          <p>🏷️ Add FAQ schema to How It Works, Technology, and Tokenomics pages</p>
        </CardContent>
      </Card>
    </div>
  );
}
