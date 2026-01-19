import { useState, useEffect, useCallback } from "react";
import { ShoppingBag, Zap, Gift, Shirt, Headphones, Watch, Battery, Sun, Star, Lock, Rocket, Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { StoreSkeleton } from "@/components/ui/loading-skeleton";
import { OptimizedImage } from "@/components/ui/optimized-image";
import merchTshirt from "@/assets/merch-tshirt.jpg";
import merchHoodie from "@/assets/merch-hoodie.jpg";
import merchCap from "@/assets/merch-cap.jpg";

interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "electronics" | "merch" | "energy";
  image: string;
  icon: React.ElementType;
  inStock: boolean;
  featured?: boolean;
}

const storeItems: StoreItem[] = [
  { id: "1", name: "Wireless Earbuds Pro", description: "Premium noise-canceling earbuds with 30hr battery life", price: 2500, category: "electronics", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=300&fit=crop", icon: Headphones, inStock: true, featured: true },
  { id: "2", name: "Smart Watch", description: "Solar-powered smartwatch with health tracking", price: 4500, category: "electronics", image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=300&fit=crop", icon: Watch, inStock: true },
  { id: "3", name: "Portable Power Bank", description: "20,000mAh solar-compatible power bank", price: 1200, category: "electronics", image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=300&fit=crop", icon: Battery, inStock: true },
  { id: "4", name: "ZenSolar T-Shirt", description: "100% organic cotton tee with ZenSolar logo", price: 500, category: "merch", image: merchTshirt, icon: Shirt, inStock: true },
  { id: "5", name: "ZenSolar Hoodie", description: "Premium eco-friendly hoodie with embroidered logo", price: 1200, category: "merch", image: merchHoodie, icon: Shirt, inStock: true, featured: true },
  { id: "6", name: "ZenSolar Cap", description: "Adjustable cap with embroidered sun logo", price: 350, category: "merch", image: merchCap, icon: Sun, inStock: false },
  { id: "7", name: "NFT Badge: Solar Pioneer", description: "Exclusive digital collectible for early adopters", price: 1000, category: "energy", image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop", icon: Star, inStock: true },
  { id: "8", name: "Carbon Offset Certificate", description: "Offset 1 ton of CO2 emissions", price: 800, category: "energy", image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=300&fit=crop", icon: Sun, inStock: true },
];

export default function Store() {
  const [activeTab, setActiveTab] = useState("all");
  const [redeemDialog, setRedeemDialog] = useState<{ open: boolean; item: StoreItem | null }>({ open: false, item: null });
  const [userTokenBalance, setUserTokenBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchTokenBalance = useCallback(async () => {
    setIsLoadingBalance(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoadingBalance(false); return; }

      const { data: profile } = await supabase.from('profiles').select('tesla_connected, enphase_connected, solaredge_connected, wallbox_connected').eq('user_id', user.id).single();
      let solarEnergy = 0, evMiles = 0, batteryDischarge = 0, superchargerKwh = 0, homeChargerKwh = 0;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setIsLoadingBalance(false); return; }

      const fetchPromises = [];
      if (profile?.enphase_connected) fetchPromises.push(supabase.functions.invoke('enphase-data', { headers: { Authorization: `Bearer ${session.access_token}` } }).then(res => ({ type: 'enphase', data: res.data })).catch(() => null));
      if (profile?.solaredge_connected) fetchPromises.push(supabase.functions.invoke('solaredge-data', { headers: { Authorization: `Bearer ${session.access_token}` } }).then(res => ({ type: 'solaredge', data: res.data })).catch(() => null));
      if (profile?.tesla_connected) fetchPromises.push(supabase.functions.invoke('tesla-data', { headers: { Authorization: `Bearer ${session.access_token}` } }).then(res => ({ type: 'tesla', data: res.data })).catch(() => null));
      if (profile?.wallbox_connected) fetchPromises.push(supabase.functions.invoke('wallbox-data', { headers: { Authorization: `Bearer ${session.access_token}` } }).then(res => ({ type: 'wallbox', data: res.data })).catch(() => null));

      const referralPromise = supabase.from('referrals').select('tokens_rewarded').eq('referrer_id', user.id);
      const results = await Promise.all([...fetchPromises, referralPromise]);
      const referralResult = results.pop() as any;
      const referralTokens = referralResult.data?.reduce((sum: number, r: any) => sum + Number(r.tokens_rewarded), 0) || 0;
      const hasDedicatedSolarProvider = profile?.enphase_connected || profile?.solaredge_connected;

      for (const result of results) {
        if (!result || !result.data) continue;
        const { type, data } = result as { type: string; data: any };
        if (type === 'enphase' && data?.totals) solarEnergy = (data.totals.lifetime_solar_wh || 0) / 1000;
        else if (type === 'solaredge' && data?.totals && !profile?.enphase_connected) solarEnergy = (data.totals.lifetime_solar_wh || 0) / 1000;
        else if (type === 'tesla' && data?.totals) {
          batteryDischarge = (data.totals.battery_discharge_wh || 0) / 1000;
          evMiles = data.totals.ev_miles || 0;
          superchargerKwh = data.totals.supercharger_kwh || 0;
          homeChargerKwh = data.totals.wall_connector_kwh || 0;
          if (!hasDedicatedSolarProvider) solarEnergy += (data.totals.solar_production_wh || 0) / 1000;
        } else if (type === 'wallbox' && data?.totals) homeChargerKwh += data.totals.home_charger_kwh || 0;
      }

      setUserTokenBalance(Math.floor(evMiles) + Math.floor(solarEnergy) + Math.floor(batteryDischarge) + Math.floor(superchargerKwh) + Math.floor(homeChargerKwh) + referralTokens);
    } catch (error) { console.error('Failed to fetch token balance:', error); } 
    finally { setIsLoadingBalance(false); setIsInitialLoad(false); }
  }, []);

  useEffect(() => { fetchTokenBalance(); }, [fetchTokenBalance]);

  if (isInitialLoad) return <StoreSkeleton />;

  const filteredItems = activeTab === "all" ? storeItems : storeItems.filter(item => item.category === activeTab);

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
            <ShoppingBag className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Rewards Store</h1>
            <p className="text-muted-foreground text-sm">Redeem your $ZSOLAR tokens for exclusive products</p>
          </div>
        </div>
      </motion.div>

      {/* Balance Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-gradient-to-br from-primary/15 via-background to-accent/10 border-primary/20 shadow-xl overflow-hidden">
          <CardContent className="flex items-center justify-between py-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
            <div className="flex items-center gap-4 relative">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Balance</p>
                {isLoadingBalance ? (
                  <div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-muted-foreground">Loading...</span></div>
                ) : (
                  <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{userTokenBalance.toLocaleString()} $ZSOLAR</p>
                )}
              </div>
            </div>
            <Button variant="outline" className="gap-2 relative"><Gift className="h-4 w-4" />Earn More</Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-md h-auto p-1.5 bg-muted/50 rounded-xl">
          {['all', 'electronics', 'merch', 'energy'].map((tab) => (
            <TabsTrigger key={tab} value={tab} className="capitalize py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg rounded-lg">{tab}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item, index) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -4 }}>
            <Card className={`overflow-hidden h-full flex flex-col transition-all shadow-lg hover:shadow-xl ${item.featured ? "ring-2 ring-primary/50" : ""} ${!item.inStock ? "opacity-75" : ""}`}>
              <div className="relative">
                <OptimizedImage
                  src={item.image}
                  alt={item.name}
                  aspectRatio="4/3"
                  priority={item.featured}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {item.featured && <Badge className="absolute top-3 right-3 bg-gradient-to-r from-primary to-accent border-0 z-10">Featured</Badge>}
                {!item.inStock && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <Badge variant="secondary" className="gap-1"><Lock className="h-3 w-3" />Out of Stock</Badge>
                  </div>
                )}
              </div>
              <CardHeader className="pb-2 flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">{item.description}</CardDescription>
                  </div>
                  <div className="p-2 rounded-lg bg-muted"><item.icon className="h-4 w-4 text-muted-foreground" /></div>
                </div>
              </CardHeader>
              <CardFooter className="flex items-center justify-between pt-0">
                <div className="flex items-center gap-1.5 text-primary font-bold"><Zap className="h-4 w-4" />{item.price.toLocaleString()}</div>
                <Button size="sm" onClick={() => item.inStock && userTokenBalance >= item.price && setRedeemDialog({ open: true, item })} disabled={!item.inStock || userTokenBalance < item.price} variant={userTokenBalance < item.price ? "secondary" : "default"}>
                  {userTokenBalance < item.price ? "Need More" : "Redeem"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Coming Soon Dialog */}
      <Dialog open={redeemDialog.open} onOpenChange={(open) => setRedeemDialog({ ...redeemDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary"><Rocket className="h-5 w-5" />🎉 Blockchain Store Coming Soon!</DialogTitle>
            <DialogDescription className="pt-4 space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
                <Sparkles className="h-8 w-8 text-primary flex-shrink-0" />
                <div><p className="font-medium text-foreground">{redeemDialog.item?.name}</p><p className="text-sm text-muted-foreground">{redeemDialog.item?.price.toLocaleString()} $ZSOLAR</p></div>
              </div>
              <p>Get ready for something <span className="font-semibold text-primary">revolutionary</span>! Our blockchain-powered store is launching soon.</p>
              <div className="space-y-2 text-sm">
                {['✨ Seamless crypto payments', '🔐 Secure blockchain transactions', '🎁 NFT receipts for purchases', '🌱 Eco-friendly products'].map((text) => (
                  <div key={text} className="flex items-center gap-2"><span className="text-primary">{text.slice(0, 2)}</span><span>{text.slice(3)}</span></div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground pt-2">Keep earning $ZSOLAR tokens — you'll be among the first to shop! 🚀</p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end"><Button onClick={() => setRedeemDialog({ open: false, item: null })}>Got it!</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
