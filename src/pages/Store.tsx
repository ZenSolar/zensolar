import { useState, useEffect, useCallback } from "react";
import { ShoppingBag, Zap, Gift, Shirt, Headphones, Watch, Battery, Sun, Star, Lock, Rocket, Sparkles, Loader2, CreditCard, TrendingUp, ChevronRight, Award, Crown, Package, Clock, Plug, Lightbulb, Home } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { OptimizedImage } from "@/components/ui/optimized-image";
import merchTshirt from "@/assets/merch-tshirt.jpg";
import merchHoodie from "@/assets/merch-hoodie.jpg";
import merchCap from "@/assets/merch-cap.jpg";
import zenLogo from "@/assets/zen-sidebar-icon.png";

interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "giftcards" | "electronics" | "merch" | "energy";
  image: string;
  icon: React.ElementType;
  inStock: boolean;
  featured?: boolean;
  limited?: boolean;
  originalPrice?: number;
}

const storeItems: StoreItem[] = [
  { 
    id: "0", 
    name: "Tesla Gift Card", 
    description: "Give the gift of Tesla. Apply towards Supercharging, vehicle accessories, apparel, software upgrades, and service payments.", 
    price: 5000, 
    category: "giftcards", 
    image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=400&h=300&fit=crop", 
    icon: CreditCard,
    inStock: true, 
    featured: true
  },
  { id: "1", name: "Wireless Earbuds Pro", description: "Premium noise-canceling earbuds with 30hr battery life", price: 2500, category: "electronics", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=300&fit=crop", icon: Headphones, inStock: true },
  { id: "2", name: "Smart Watch", description: "Solar-powered smartwatch with health tracking", price: 4500, category: "electronics", image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=300&fit=crop", icon: Watch, inStock: true },
  { id: "3", name: "Portable Power Bank", description: "20,000mAh solar-compatible power bank", price: 1200, category: "electronics", image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=300&fit=crop", icon: Battery, inStock: true },
  { id: "4", name: "ZenSolar T-Shirt", description: "100% organic cotton tee with ZenSolar logo", price: 500, category: "merch", image: merchTshirt, icon: Shirt, inStock: true },
  { id: "5", name: "ZenSolar Hoodie", description: "Premium eco-friendly hoodie with embroidered logo", price: 1200, category: "merch", image: merchHoodie, icon: Shirt, inStock: true, featured: true },
  { id: "6", name: "ZenSolar Cap", description: "Adjustable cap with embroidered sun logo", price: 350, category: "merch", image: merchCap, icon: Sun, inStock: false },
  { id: "7", name: "NFT Badge: Solar Pioneer", description: "Exclusive digital collectible for early adopters", price: 1000, category: "energy", image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop", icon: Star, inStock: true },
  { id: "8", name: "Carbon Offset Certificate", description: "Offset 1 ton of CO2 emissions", price: 800, category: "energy", image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=300&fit=crop", icon: Sun, inStock: true },
];

// Coming Soon items - lifestyle products for homeowners
interface ComingSoonItem {
  id: string;
  name: string;
  description: string;
  estimatedPrice: number;
  image: string;
  icon: React.ElementType;
  tier: "affordable" | "moderate" | "premium";
  brand?: string;
}

const comingSoonItems: ComingSoonItem[] = [
  // Affordable tier (under 1,500 tokens)
  { 
    id: "cs-1", 
    name: "Anker Nano Charger 30W", 
    description: "Ultra-compact USB-C fast charger for phones and tablets", 
    estimatedPrice: 250, 
    image: "https://m.media-amazon.com/images/I/51d+3FwGI0L._AC_SL1500_.jpg", 
    icon: Plug,
    tier: "affordable",
    brand: "Anker"
  },
  { 
    id: "cs-2", 
    name: "Tesla CyberVessel", 
    description: "Stainless steel insulated water bottle inspired by Cybertruck design", 
    estimatedPrice: 750, 
    image: "https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Shop-Fall-2024-CyberVessel-02.jpg", 
    icon: Sun,
    tier: "affordable",
    brand: "Tesla"
  },
  { 
    id: "cs-3", 
    name: "EcoFlow USB-C Cable Set", 
    description: "Premium braided cables with 240W fast charging support", 
    estimatedPrice: 400, 
    image: "https://us.ecoflow.com/cdn/shop/products/USB-C_to_USB-C_Cable_6.6ft_01.png?v=1679378936&width=1200", 
    icon: Zap,
    tier: "affordable",
    brand: "EcoFlow"
  },
  // Moderate tier (1,500 - 5,000 tokens)
  { 
    id: "cs-4", 
    name: "Anker MagGo 3-in-1 Charger", 
    description: "Foldable wireless charging station for phone, watch, and earbuds", 
    estimatedPrice: 1500, 
    image: "https://m.media-amazon.com/images/I/61UGe+WVQFL._AC_SL1500_.jpg", 
    icon: Battery,
    tier: "moderate",
    brand: "Anker"
  },
  { 
    id: "cs-5", 
    name: "Tesla Mobile Connector", 
    description: "Portable EV charging adapter with multiple outlet options", 
    estimatedPrice: 4000, 
    image: "https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Charging-Mobile-Connector-Hero.png", 
    icon: Plug,
    tier: "moderate",
    brand: "Tesla"
  },
  { 
    id: "cs-6", 
    name: "Anker PowerCore 24K Bank", 
    description: "High-capacity 24,000mAh portable power station for laptops", 
    estimatedPrice: 1800, 
    image: "https://m.media-amazon.com/images/I/61mHv6cJUfL._AC_SL1500_.jpg", 
    icon: Battery,
    tier: "moderate",
    brand: "Anker"
  },
  // Premium tier (5,000+ tokens)
  { 
    id: "cs-7", 
    name: "EcoFlow DELTA 3 Power Station", 
    description: "1024Wh portable power station for home backup and outdoor adventures", 
    estimatedPrice: 6500, 
    image: "https://us.ecoflow.com/cdn/shop/files/DELTA_3_US_1.png?v=1727251447&width=1200", 
    icon: Lightbulb,
    tier: "premium",
    brand: "EcoFlow"
  },
  { 
    id: "cs-8", 
    name: "Tesla Wall Connector", 
    description: "Premium Level 2 home charging with up to 48A and WiFi connectivity", 
    estimatedPrice: 7000, 
    image: "https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Charging-Wall-Connector-Hero.png", 
    icon: Home,
    tier: "premium",
    brand: "Tesla"
  },
  { 
    id: "cs-9", 
    name: "Anker SOLIX C1000 Station", 
    description: "1056Wh whole-home backup with fast solar charging capability", 
    estimatedPrice: 7500, 
    image: "https://m.media-amazon.com/images/I/71jCybVpWgL._AC_SL1500_.jpg", 
    icon: Sun,
    tier: "premium",
    brand: "Anker"
  },
];

const categories = [
  { id: "all", label: "All Items", icon: Package },
  { id: "giftcards", label: "Gift Cards", icon: CreditCard },
  { id: "electronics", label: "Electronics", icon: Headphones },
  { id: "merch", label: "Merch", icon: Shirt },
  { id: "energy", label: "Energy", icon: Sun },
  { id: "coming-soon", label: "Coming Soon", icon: Clock },
];

export default function Store() {
  const [activeTab, setActiveTab] = useState("all");
  const [redeemDialog, setRedeemDialog] = useState<{ open: boolean; item: StoreItem | null }>({ open: false, item: null });
  const [userTokenBalance, setUserTokenBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const fetchTokenBalance = useCallback(async () => {
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
    finally { setIsLoadingBalance(false); }
  }, []);

  useEffect(() => { fetchTokenBalance(); }, [fetchTokenBalance]);

  const filteredItems = activeTab === "all" ? storeItems : activeTab === "coming-soon" ? [] : storeItems.filter(item => item.category === activeTab);
  const canAfford = (price: number) => userTokenBalance !== null && userTokenBalance >= price;
  const getAffordabilityPercent = (price: number) => userTokenBalance !== null ? Math.min(100, (userTokenBalance / price) * 100) : 0;
  const isComingSoonTab = activeTab === "coming-soon";

  // Get featured item for hero section
  const featuredItem = storeItems.find(item => item.featured && item.id === "0");

  return (
    <div className="min-h-screen">
      {/* Gradient Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-8">
        {/* Premium Header with ZenSolar Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="relative"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* ZenSolar Logo */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary via-primary to-accent rounded-2xl blur-lg opacity-50 animate-pulse" />
                <img 
                  src={zenLogo} 
                  alt="ZenSolar" 
                  className="relative h-16 w-16 sm:h-18 sm:w-18 rounded-2xl object-cover shadow-xl ring-2 ring-secondary/30"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">ZenSolar Store</h1>
                  <Badge variant="secondary" className="gap-1 text-xs font-medium bg-secondary/15 text-secondary border-secondary/30">
                    <Sparkles className="h-3 w-3" />
                    Beta
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                  Redeem your <span className="font-semibold text-secondary">$ZSOLAR</span> tokens for exclusive rewards
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-card via-card to-secondary/5">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-secondary/20 via-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/15 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
            
            <CardContent className="relative py-6 sm:py-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary to-accent rounded-2xl blur opacity-60" />
                    <div className="relative p-5 rounded-2xl bg-gradient-to-br from-secondary via-secondary to-accent shadow-xl">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      Your Balance
                      {!isLoadingBalance && userTokenBalance !== null && userTokenBalance > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-secondary">
                          <TrendingUp className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </p>
                    {isLoadingBalance ? (
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-48 bg-muted/50 rounded-lg animate-pulse" />
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-secondary via-primary to-accent bg-clip-text text-transparent tabular-nums">
                          {(userTokenBalance ?? 0).toLocaleString()}
                        </p>
                        <span className="text-lg font-semibold text-muted-foreground">$ZSOLAR</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:items-end gap-3">
                  <Button 
                    size="lg" 
                    className="gap-2 bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90 shadow-lg shadow-secondary/25 transition-all duration-300 hover:shadow-xl hover:shadow-secondary/30 hover:-translate-y-0.5"
                  >
                    <Gift className="h-4 w-4" />
                    Earn More Tokens
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground">Connect devices to earn more rewards</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Featured Hero Item - Hide when Coming Soon tab is active */}
        {featuredItem && !isComingSoonTab && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-r from-card via-card to-accent/5">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-accent/10 to-transparent" />
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="relative md:w-2/5 aspect-video md:aspect-auto">
                    <OptimizedImage
                      src={featuredItem.image}
                      alt={featuredItem.name}
                      aspectRatio="video"
                      priority
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-card" />
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <Badge className="bg-accent text-accent-foreground border-0 gap-1 shadow-lg">
                        <Crown className="h-3 w-3" />
                        Featured
                      </Badge>
                      {false && featuredItem.limited && (
                        <Badge variant="secondary" className="bg-destructive/90 text-destructive-foreground border-0 gap-1">
                          Limited
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative flex-1 p-6 md:p-8 flex flex-col justify-center">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">{featuredItem.name}</h3>
                        <p className="text-muted-foreground mt-2 text-base leading-relaxed">{featuredItem.description}</p>
                      </div>
                      
                        <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-secondary/10">
                            <Zap className="h-5 w-5 text-secondary" />
                          </div>
                          <span className="text-2xl font-bold text-secondary">{featuredItem.price.toLocaleString()}</span>
                          <span className="text-sm font-medium text-muted-foreground">$ZSOLAR</span>
                        </div>
                        
                        {!isLoadingBalance && !canAfford(featuredItem.price) && (
                          <div className="flex-1 max-w-xs">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>Progress</span>
                              <span>{Math.floor(getAffordabilityPercent(featuredItem.price))}%</span>
                            </div>
                            <Progress value={getAffordabilityPercent(featuredItem.price)} className="h-2" />
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        size="lg"
                        onClick={() => featuredItem.inStock && canAfford(featuredItem.price) && setRedeemDialog({ open: true, item: featuredItem })} 
                        disabled={!featuredItem.inStock || isLoadingBalance || !canAfford(featuredItem.price)}
                        className={`gap-2 w-full sm:w-auto ${canAfford(featuredItem.price) ? 'bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90 shadow-lg' : ''}`}
                        variant={!canAfford(featuredItem.price) && !isLoadingBalance ? "secondary" : "default"}
                      >
                        {isLoadingBalance ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Calculating...
                          </>
                        ) : !canAfford(featuredItem.price) ? (
                          <>
                            <TrendingUp className="h-4 w-4" />
                            Need {(featuredItem.price - (userTokenBalance ?? 0)).toLocaleString()} more
                          </>
                        ) : (
                          <>
                            <Award className="h-4 w-4" />
                            Redeem Now
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide">
              <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 h-auto p-1.5 bg-card/80 backdrop-blur-sm rounded-2xl border shadow-sm gap-1">
                {categories.map((cat) => (
                  <TabsTrigger 
                    key={cat.id} 
                    value={cat.id} 
                    className="flex-shrink-0 py-2.5 px-4 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-xl transition-all duration-200 gap-2 whitespace-nowrap"
                  >
                    <cat.icon className="h-4 w-4 hidden sm:block" />
                    <span>{cat.id === 'giftcards' ? 'Gift Cards' : cat.id === 'all' ? 'All' : cat.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        </motion.div>

        {/* Products Grid - Hide when Coming Soon tab is active */}
        {!isComingSoonTab && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.filter(item => item.id !== "0" || activeTab !== "all").map((item, index) => (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, y: 20, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ delay: index * 0.04, duration: 0.3 }} 
                layout
                onHoverStart={() => setHoveredItem(item.id)}
                onHoverEnd={() => setHoveredItem(null)}
              >
                <Card className={`group relative overflow-hidden h-full flex flex-col transition-all duration-300 border-0 shadow-lg hover:shadow-2xl ${item.featured ? "ring-2 ring-secondary/40 ring-offset-2 ring-offset-background" : ""} ${!item.inStock ? "opacity-60" : ""} ${hoveredItem === item.id ? "scale-[1.02] -translate-y-1" : ""}`}>
                  {/* Image Section */}
                  <div className="relative overflow-hidden">
                    <div className={`transition-transform duration-500 ${hoveredItem === item.id ? "scale-110" : "scale-100"}`}>
                      <OptimizedImage
                        src={item.image}
                        alt={item.name}
                        aspectRatio="4/3"
                        priority={item.featured}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 z-10">
                      {item.featured && (
                        <Badge className="bg-secondary text-secondary-foreground border-0 gap-1 shadow-lg text-xs">
                          <Star className="h-3 w-3" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    
                    {/* Out of stock overlay */}
                    {!item.inStock && (
                      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-10">
                        <Badge variant="secondary" className="gap-2 py-2 px-4 text-sm">
                          <Lock className="h-4 w-4" />
                          Out of Stock
                        </Badge>
                      </div>
                    )}
                    
                    {/* Category icon */}
                    <div className="absolute top-3 right-3 p-2 rounded-xl bg-background/90 backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <item.icon className="h-4 w-4 text-foreground" />
                    </div>
                  </div>
                  
                  {/* Content Section */}
                  <CardHeader className="pb-3 flex-1">
                    <CardTitle className="text-lg font-semibold tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                      {item.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  
                  {/* Footer Section */}
                  <CardFooter className="flex flex-col gap-3 pt-0">
                    {/* Price and Progress */}
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-secondary/10">
                            <Zap className="h-4 w-4 text-secondary" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-secondary">{item.price.toLocaleString()}</span>
                            <span className="text-xs font-medium text-muted-foreground">$ZSOLAR</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress bar for unaffordable items */}
                      {!isLoadingBalance && !canAfford(item.price) && item.inStock && (
                        <div className="space-y-1">
                          <Progress value={getAffordabilityPercent(item.price)} className="h-1.5" />
                          <p className="text-xs text-muted-foreground">
                            {Math.floor(getAffordabilityPercent(item.price))}% • Need {(item.price - (userTokenBalance ?? 0)).toLocaleString()} more
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Button */}
                    <Button 
                      className={`w-full gap-2 transition-all duration-300 ${canAfford(item.price) && item.inStock ? 'bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90 shadow-md hover:shadow-lg' : ''}`}
                      size="sm" 
                      onClick={() => item.inStock && canAfford(item.price) && setRedeemDialog({ open: true, item })} 
                      disabled={!item.inStock || isLoadingBalance || !canAfford(item.price)} 
                      variant={!canAfford(item.price) && !isLoadingBalance ? "secondary" : "default"}
                    >
                      {isLoadingBalance ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : !canAfford(item.price) ? (
                        <>
                          <TrendingUp className="h-4 w-4" />
                          Earn More
                        </>
                      ) : (
                        <>
                          <Award className="h-4 w-4" />
                          Redeem
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        )}

        {/* Empty State - Show only for non-coming-soon tabs */}
        {filteredItems.length === 0 && !isComingSoonTab && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="p-4 rounded-2xl bg-muted/50 mb-4">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No items found</h3>
            <p className="text-muted-foreground text-sm mt-1">Check back soon for new products in this category</p>
          </motion.div>
        )}

        {/* Coming Soon Section - Show when Coming Soon tab is active */}
        {isComingSoonTab && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
          {/* Section Header */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent to-primary rounded-xl blur opacity-50 animate-pulse" />
              <div className="relative p-3 rounded-xl bg-gradient-to-br from-accent via-primary to-secondary">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Coming Soon</h2>
              <p className="text-sm text-muted-foreground">Exciting rewards launching soon — keep earning!</p>
            </div>
          </div>

          {/* Tier Sections */}
          {(["affordable", "moderate", "premium"] as const).map((tier) => {
            const tierItems = comingSoonItems.filter(item => item.tier === tier);
            const tierConfig = {
              affordable: { 
                label: "Everyday Essentials", 
                sublabel: "Under 1,500 $ZSOLAR",
                gradient: "from-emerald-500/10 to-teal-500/10",
                borderColor: "border-emerald-500/20"
              },
              moderate: { 
                label: "Smart Home Upgrades", 
                sublabel: "1,500 - 5,000 $ZSOLAR",
                gradient: "from-blue-500/10 to-indigo-500/10",
                borderColor: "border-blue-500/20"
              },
              premium: { 
                label: "Premium Power", 
                sublabel: "5,000+ $ZSOLAR",
                gradient: "from-amber-500/10 to-orange-500/10",
                borderColor: "border-amber-500/20"
              },
            };
            const config = tierConfig[tier];

            return (
              <div key={tier} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{config.label}</h3>
                  <Badge variant="outline" className={`text-xs ${config.borderColor}`}>
                    {config.sublabel}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tierItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <Card className={`relative overflow-hidden border bg-gradient-to-br ${config.gradient} backdrop-blur-sm hover:shadow-lg transition-all duration-300 group`}>
                        {/* Coming Soon Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent z-10 pointer-events-none" />
                        
                        {/* Image */}
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <OptimizedImage
                            src={item.image}
                            alt={item.name}
                            aspectRatio="4/3"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="opacity-70 group-hover:opacity-85 group-hover:scale-105 transition-all duration-500"
                          />
                          {/* Brand Badge */}
                          {item.brand && (
                            <div className="absolute top-3 left-3 z-20">
                              <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-xs font-medium shadow-lg">
                                {item.brand}
                              </Badge>
                            </div>
                          )}
                          {/* Coming Soon Badge */}
                          <div className="absolute top-3 right-3 z-20">
                            <Badge className="bg-accent/90 text-accent-foreground border-0 gap-1 shadow-lg">
                              <Clock className="h-3 w-3" />
                              Soon
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <CardContent className="relative z-20 pt-4 pb-4 space-y-3">
                          <div>
                            <h4 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                              {item.name}
                            </h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {item.description}
                            </p>
                          </div>
                          
                          {/* Estimated Price */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1 rounded-md bg-secondary/10">
                                <Zap className="h-3.5 w-3.5 text-secondary" />
                              </div>
                              <span className="text-sm font-semibold text-secondary">
                                ~{item.estimatedPrice.toLocaleString()}
                              </span>
                              <span className="text-xs text-muted-foreground">$ZSOLAR</span>
                            </div>
                            <Button variant="ghost" size="sm" disabled className="gap-1 text-xs opacity-60">
                              <Clock className="h-3 w-3" />
                              Notify Me
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </motion.div>
        )}

        {/* Coming Soon Dialog - Enhanced */}
        <Dialog open={redeemDialog.open} onOpenChange={(open) => setRedeemDialog({ ...redeemDialog, open })}>
          <DialogContent className="sm:max-w-md border-0 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-accent/5 rounded-lg" />
            <DialogHeader className="relative">
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-xl bg-gradient-to-br from-secondary to-primary">
                  <Rocket className="h-5 w-5 text-white" />
                </div>
                Blockchain Store Coming Soon!
              </DialogTitle>
              <DialogDescription className="pt-6 space-y-5">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-secondary/10 to-accent/10 border border-secondary/20">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary to-accent rounded-xl blur opacity-50" />
                    <div className="relative p-3 rounded-xl bg-gradient-to-br from-secondary to-accent">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-lg truncate">{redeemDialog.item?.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3 text-secondary" />
                      {redeemDialog.item?.price.toLocaleString()} $ZSOLAR
                    </p>
                  </div>
                </div>
                
                <p className="text-base">
                  Get ready for something <span className="font-semibold text-secondary">revolutionary</span>! Our blockchain-powered store is launching soon.
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: '✨', text: 'Seamless crypto payments' },
                    { icon: '🔐', text: 'Secure transactions' },
                    { icon: '🎁', text: 'NFT purchase receipts' },
                    { icon: '🌱', text: 'Eco-friendly products' }
                  ].map((feature) => (
                    <div key={feature.text} className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 text-sm">
                      <span>{feature.icon}</span>
                      <span className="font-medium">{feature.text}</span>
                    </div>
                  ))}
                </div>
                
                <p className="text-sm text-muted-foreground text-center pt-2">
                  Keep earning $ZSOLAR tokens — you'll be among the first to shop! 🚀
                </p>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end pt-2 relative">
              <Button 
                onClick={() => setRedeemDialog({ open: false, item: null })}
                className="gap-2 bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90"
              >
                Got it!
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}