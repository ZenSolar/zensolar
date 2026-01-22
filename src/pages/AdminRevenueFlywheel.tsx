import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, TrendingUp, Coins, Users, Droplets, Flame, Building, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { ExportButtons } from "@/components/admin/ExportButtons";

export default function AdminRevenueFlywheel() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking: adminLoading } = useAdminCheck();

  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground mt-2">This page is only accessible to administrators.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 pt-4 pb-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
        <Badge variant="outline" className="text-primary border-primary">
          <TrendingUp className="h-3 w-3 mr-1" />
          Revenue Model
        </Badge>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Revenue Flywheel</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">How subscription fees and transaction fees flow to the liquidity pool via smart contract automation.</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Badge variant="secondary" className="text-xs">Admin Only • Internal Documentation</Badge>
          <ExportButtons 
            pageTitle="Revenue Flywheel" 
            getData={() => [
              { flow: "Subscriptions", source: "$9.99/mo", lpContribution: "50% ($4.995)", impact: "Direct LP injection" },
              { flow: "Transfer Tax", source: "7% of trades", lpContribution: "2%", impact: "Continuous LP growth" },
              { flow: "Mint Burn", source: "20% of mints", lpContribution: "N/A", impact: "Supply deflation" },
              { flow: "Treasury Tax", source: "2% of trades", lpContribution: "N/A", impact: "Operations funding" },
            ]} 
          />
        </div>
      </motion.div>

      {/* Visual Flywheel Diagram */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-primary" />
              LP-Backed Token Growth Model
            </CardTitle>
            <CardDescription>Automated on-chain fund flows that create sustainable buy pressure</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Flywheel Diagram */}
            <div className="relative py-8">
              {/* Flow 1: Subscriptions */}
              <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-blue-600/10 border border-blue-500/30"
                >
                  <Users className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-bold text-lg">Subscriptions</p>
                    <p className="text-sm text-muted-foreground">$9.99/month</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  initial={{ x: -20, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }} 
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2"
                >
                  <ArrowRight className="h-6 w-6 text-emerald-500" />
                  <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-lg px-4 py-1">50%</Badge>
                  <ArrowRight className="h-6 w-6 text-emerald-500" />
                </motion.div>

                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-600/10 border border-emerald-500/30"
                >
                  <Droplets className="h-8 w-8 text-emerald-500" />
                  <div>
                    <p className="font-bold text-lg">Liquidity Pool</p>
                    <p className="text-sm text-muted-foreground">DEX Trading Pair</p>
                  </div>
                </motion.div>
              </div>

              {/* Flow 2: Transactions */}
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-purple-600/10 border border-purple-500/30"
                >
                  <Coins className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="font-bold text-lg">All Token Txns</p>
                    <p className="text-sm text-muted-foreground">Transfers & Trades</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  initial={{ x: -20, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }} 
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-2"
                >
                  <ArrowRight className="h-6 w-6 text-purple-500" />
                  <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30 text-lg px-4 py-1">1%</Badge>
                  <ArrowRight className="h-6 w-6 text-purple-500" />
                </motion.div>

                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  transition={{ delay: 0.7 }}
                  className="flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-600/10 border border-emerald-500/30"
                >
                  <Droplets className="h-8 w-8 text-emerald-500" />
                  <div>
                    <p className="font-bold text-lg">Liquidity Pool</p>
                    <p className="text-sm text-muted-foreground">DEX Trading Pair</p>
                  </div>
                </motion.div>
              </div>

              {/* Result Arrow */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ delay: 0.8 }}
                className="flex justify-center mt-8"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-0.5 bg-gradient-to-b from-emerald-500 to-amber-500" />
                  <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-600/10 border border-amber-500/30">
                    <TrendingUp className="h-8 w-8 text-amber-500" />
                    <div>
                      <p className="font-bold text-lg">Token Price Floor ↑</p>
                      <p className="text-sm text-muted-foreground">Sustainable growth</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Revenue Streams Detail */}
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Subscription Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Fee</span>
                  <span className="font-bold">$9.99</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">LP Allocation</span>
                  <Badge className="bg-emerald-500/20 text-emerald-600">50%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Per User → LP</span>
                  <span className="font-bold text-emerald-600">~$5/month</span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>Free Tier:</strong> Explore the app, view metrics, but cannot mint tokens to wallet.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Paid Tier:</strong> Full minting capabilities, token transfers, and store redemptions.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-purple-500" />
                Transaction Fee Allocation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Transfer Tax</span>
                  <span className="font-bold">7%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Flame className="h-4 w-4 text-orange-500" /> Burn
                  </span>
                  <Badge className="bg-orange-500/20 text-orange-600">3.5%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Building className="h-4 w-4 text-blue-500" /> Treasury
                  </span>
                  <Badge className="bg-blue-500/20 text-blue-600">3.5%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Droplets className="h-4 w-4 text-emerald-500" /> LP (additional)
                  </span>
                  <Badge className="bg-emerald-500/20 text-emerald-600">1%</Badge>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  The 1% LP fee is <strong>in addition to</strong> the existing 7% tax, applied via smart contract.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Projections */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Growth Projections
            </CardTitle>
            <CardDescription>Monthly LP injection based on paying user count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Paying Users</th>
                    <th className="text-right py-3 px-4 font-semibold">Monthly Revenue</th>
                    <th className="text-right py-3 px-4 font-semibold">LP Injection (50%)</th>
                    <th className="text-right py-3 px-4 font-semibold">Annual LP Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { users: 100, revenue: 999, lp: 500, annual: 6000 },
                    { users: 1000, revenue: 9990, lp: 4995, annual: 59940 },
                    { users: 10000, revenue: 99900, lp: 49950, annual: 599400 },
                    { users: 100000, revenue: 999000, lp: 499500, annual: 5994000 },
                  ].map((row) => (
                    <tr key={row.users} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4">{row.users.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">${row.revenue.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-semibold">${row.lp.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-amber-600 font-bold">${row.annual.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              * This excludes additional LP injection from the 1% transaction fee, which grows with trading volume.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Investment Thesis */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-amber-500" />
              Investment Thesis ($0.10 Floor → $1.00 Target)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Unlike most tokens where liquidity pools are funded once at launch and then depleted as early investors exit, 
              $ZSOLAR's LP <strong>grows continuously</strong> with the business:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>Revenue-backed:</strong> Every new subscriber adds ~$5/month to LP via smart contract</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>$0.10 Floor:</strong> $300K USDC paired with 3M tokens at launch (10x to $1.00)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>$1M-$2M Seed:</strong> Covers LP seed, legal, audit, team, and marketing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>Deflationary:</strong> 20% mint burn + 7% transfer tax (3% burn + 2% LP + 2% treasury)</span>
              </li>
            </ul>
            <div className="pt-4 border-t mt-4">
              <p className="text-sm font-semibold text-amber-600">
                "At 25K paying subscribers (Tipping Point), that's $125K/month of LP injection — visible on-chain."
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Legal Caution */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <Card className="border-dashed bg-muted/30">
          <CardHeader>
            <CardTitle className="text-muted-foreground">⚠️ Marketing Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              When marketing to retail investors, avoid phrases like "token will increase in value" or "guaranteed returns" 
              as this may trigger SEC securities classification (Howey Test). Instead:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              <li>• Emphasize <strong>utility</strong> (minting, store redemption, carbon offsets)</li>
              <li>• Let the LP mechanics speak for themselves</li>
              <li>• Avoid "investment returns" language</li>
              <li>• Focus on the <strong>verified energy production</strong> use case</li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}