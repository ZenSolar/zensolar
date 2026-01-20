import { useState, useEffect, useCallback } from "react";
import { ShoppingBag, Zap, Gift, Shirt, Headphones, Watch, Battery, Sun, Star, Lock, Rocket, Sparkles, Loader2, CreditCard, TrendingUp, ChevronRight, Award, Crown, Package, Clock, Plug, Lightbulb, Home, Eye, CheckCircle2, Flame } from "lucide-react";
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

// Product images
import teslaGiftCardImg from "@/assets/store/tesla-gift-card.jpg";
import ankerNano30wImg from "@/assets/store/anker-nano-30w.jpg";
import teslaCybervesselImg from "@/assets/store/tesla-cybervessel.jpg";
import ankerMaggo3in1Img from "@/assets/store/anker-maggo-3in1.jpg";
import teslaMobileConnectorImg from "@/assets/store/tesla-mobile-connector.jpg";
import ankerPowercore24kImg from "@/assets/store/anker-powercore-24k.jpg";
import ecoflowDelta3Img from "@/assets/store/ecoflow-delta3.jpg";
import teslaWallConnectorImg from "@/assets/store/tesla-wall-connector.jpg";
import ankerSolixC1000Img from "@/assets/store/anker-solix-c1000.jpg";

interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "giftcards" | "electronics" | "merch" | "energy" | "power" | "charging";
  image: string;
  icon: React.ElementType;
  inStock: boolean;
  featured?: boolean;
  brand?: string;
}

// All store items with real product images
const storeItems: StoreItem[] = [
  // Gift Cards
  { 
    id: "0", 
    name: "Tesla Gift Card", 
    description: "Give the gift of Tesla. Apply towards Supercharging, vehicle accessories, apparel, software upgrades, and service payments.", 
    price: 5000, 
    category: "giftcards", 
    image: teslaGiftCardImg, 
    icon: CreditCard,
    inStock: true, 
    featured: true,
    brand: "Tesla"
  },
  // Electronics
  { id: "1", name: "Wireless Earbuds Pro", description: "Premium noise-canceling earbuds with 30hr battery life", price: 2500, category: "electronics", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=600&fit=crop", icon: Headphones, inStock: true },
  { id: "2", name: "Smart Watch", description: "Solar-powered smartwatch with health tracking", price: 4500, category: "electronics", image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&h=600&fit=crop", icon: Watch, inStock: true },
  { id: "3", name: "Portable Power Bank", description: "20,000mAh solar-compatible power bank", price: 1200, category: "electronics", image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=600&fit=crop", icon: Battery, inStock: true },
  // Merch
  { id: "4", name: "ZenSolar T-Shirt", description: "100% organic cotton tee with ZenSolar logo", price: 500, category: "merch", image: merchTshirt, icon: Shirt, inStock: true },
  { id: "5", name: "ZenSolar Hoodie", description: "Premium eco-friendly hoodie with embroidered logo", price: 1200, category: "merch", image: merchHoodie, icon: Shirt, inStock: true, featured: true },
  { id: "6", name: "ZenSolar Cap", description: "Adjustable cap with embroidered sun logo", price: 350, category: "merch", image: merchCap, icon: Sun, inStock: true },
  // Energy
  { id: "7", name: "NFT Badge: Solar Pioneer", description: "Exclusive digital collectible for early adopters", price: 1000, category: "energy", image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=600&fit=crop", icon: Star, inStock: true },
  { id: "8", name: "Carbon Offset Certificate", description: "Offset 1 ton of CO2 emissions", price: 800, category: "energy", image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&h=600&fit=crop", icon: Sun, inStock: true },
  // Power & Charging Products
  { 
    id: "ps-1", 
    name: "Anker Nano Charger 30W", 
    description: "Ultra-compact USB-C fast charger for phones and tablets", 
    price: 250, 
    category: "power",
    image: ankerNano30wImg, 
    icon: Plug,
    inStock: true,
    brand: "Anker"
  },
  { 
    id: "ps-2", 
    name: "Tesla CyberVessel", 
    description: "Stainless steel insulated water bottle inspired by Cybertruck design", 
    price: 750, 
    category: "merch",
    image: teslaCybervesselImg, 
    icon: Sun,
    inStock: true,
    brand: "Tesla"
  },
  { 
    id: "ps-3", 
    name: "Anker MagGo 3-in-1 Charger", 
    description: "Foldable wireless charging station for phone, watch, and earbuds", 
    price: 1500, 
    category: "charging",
    image: ankerMaggo3in1Img, 
    icon: Battery,
    inStock: true,
    brand: "Anker"
  },
  { 
    id: "ps-4", 
    name: "Tesla Mobile Connector", 
    description: "Portable EV charging adapter with multiple outlet options", 
    price: 4000, 
    category: "charging",
    image: teslaMobileConnectorImg, 
    icon: Plug,
    inStock: true,
    brand: "Tesla",
    featured: true
  },
  { 
    id: "ps-5", 
    name: "Anker PowerCore 24K Bank", 
    description: "High-capacity 24,000mAh portable power station for laptops", 
    price: 1800, 
    category: "power",
    image: ankerPowercore24kImg, 
    icon: Battery,
    inStock: true,
    brand: "Anker"
  },
  { 
    id: "ps-6", 
    name: "EcoFlow DELTA 3 Power Station", 
    description: "1024Wh portable power station for home backup and outdoor adventures", 
    price: 6500, 
    category: "power",
    image: ecoflowDelta3Img, 
    icon: Lightbulb,
    inStock: true,
    brand: "EcoFlow",
    featured: true
  },
  { 
    id: "ps-7", 
    name: "Tesla Wall Connector", 
    description: "Premium Level 2 home charging with up to 48A and WiFi connectivity", 
    price: 7000, 
    category: "charging",
    image: teslaWallConnectorImg, 
    icon: Home,
    inStock: true,
    brand: "Tesla",
    featured: true
  },
  { 
    id: "ps-8", 
    name: "Anker SOLIX C1000 Station", 
    description: "1056Wh whole-home backup with fast solar charging capability", 
    price: 7500, 
    category: "power",
    image: ankerSolixC1000Img, 
    icon: Sun,
    inStock: true,
    brand: "Anker",
    featured: true
  },
];

const categories = [
  { id: "all", label: "All Items", icon: Package },
  { id: "featured", label: "Featured", icon: Crown },
  { id: "power", label: "Power", icon: Lightbulb },
  { id: "charging", label: "Charging", icon: Plug },
  { id: "giftcards", label: "Gift Cards", icon: CreditCard },
  { id: "electronics", label: "Electronics", icon: Headphones },
  { id: "merch", label: "Merch", icon: Shirt },
  { id: "energy", label: "Energy", icon: Sun },
];

// Premium Product Card Component (no tiers)
function PremiumProductCard({ 
  item, 
  canAfford, 
  affordabilityPercent,
  isLoadingBalance,
  onRedeem,
  hoveredItem,
  onHover
}: { 
  item: StoreItem; 
  canAfford: boolean;
  affordabilityPercent: number;
  isLoadingBalance: boolean;
  onRedeem: (item: StoreItem) => void;
  hoveredItem: string | null;
  onHover: (id: string | null) => void;
}) {
  const isHovered = hoveredItem === item.id;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ 
        scale: 1.03,
        y: -8,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.4 }}
      onHoverStart={() => onHover(item.id)}
      onHoverEnd={() => onHover(null)}
      className={`relative rounded-2xl overflow-hidden cursor-pointer group ${
        item.inStock 
          ? 'bg-card border-2 border-border/50 shadow-xl hover:border-secondary/50 hover:shadow-secondary/20' 
          : 'bg-card/50 border border-border/40 opacity-60'
      }`}
    >
      {/* Animated shimmer overlay */}
      {item.inStock && (
        <motion.div 
          className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100"
          style={{
            background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['-100% 0', '200% 0'] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
        />
      )}
      
      {/* Product Image */}
      <div className="relative w-full aspect-square overflow-hidden bg-muted/30">
        <motion.div
          className="w-full h-full"
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <OptimizedImage
            src={item.image}
            alt={item.name}
            aspectRatio="square"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Brand & Featured Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
          {item.featured && (
            <Badge className="bg-accent/90 backdrop-blur-sm text-accent-foreground gap-1 text-[10px] shadow-lg border-0">
              <Crown className="h-3 w-3" />
              Featured
            </Badge>
          )}
          {item.brand && (
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-[10px] shadow-lg">
              {item.brand}
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
        
        {/* View overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/20 z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 text-white bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full"
          >
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">View Details</span>
          </motion.div>
        </div>
        
        {/* Name overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <h3 className="font-bold text-white text-lg drop-shadow-lg line-clamp-1">{item.name}</h3>
          <p className="text-xs text-white/80 line-clamp-1">{item.description}</p>
        </div>
      </div>

      {/* Card footer */}
      <div className="p-4 space-y-3 bg-gradient-to-b from-transparent to-background/50">
        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-secondary to-accent">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-secondary">
                {item.price.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">$ZSOLAR</span>
            </div>
          </div>
        </div>
        
        {/* Progress bar for unaffordable items */}
        {!isLoadingBalance && !canAfford && item.inStock && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.floor(affordabilityPercent)}%</span>
            </div>
            <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-secondary to-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${affordabilityPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button 
          className={`w-full gap-2 transition-all duration-300 ${
            canAfford && item.inStock 
              ? 'bg-gradient-to-r from-secondary to-accent hover:opacity-90 text-white border-0 shadow-lg' 
              : ''
          }`}
          size="sm" 
          onClick={() => item.inStock && canAfford && onRedeem(item)} 
          disabled={!item.inStock || isLoadingBalance || !canAfford} 
          variant={!canAfford && !isLoadingBalance ? "secondary" : "default"}
        >
          {isLoadingBalance ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : !canAfford ? (
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
      </div>
    </motion.div>
  );
}

// Featured Hero Card (no tiers)
function FeaturedHeroCard({
  item,
  canAfford,
  affordabilityPercent,
  isLoadingBalance,
  onRedeem
}: {
  item: StoreItem;
  canAfford: boolean;
  affordabilityPercent: number;
  isLoadingBalance: boolean;
  onRedeem: (item: StoreItem) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01, transition: { duration: 0.3 } }}
      className="relative"
    >
      {/* Glowing backdrop */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-secondary via-primary to-accent opacity-30 blur-xl -z-10" />
      
      <Card className="relative overflow-hidden border-2 border-secondary/40 shadow-2xl shadow-secondary/20 bg-gradient-to-br from-card via-card to-transparent">
        {/* Animated shimmer */}
        <motion.div 
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['-100% 0', '200% 0'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
        />
        
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            {/* Image Section */}
            <div className="relative lg:w-2/5 aspect-[4/3] lg:aspect-auto overflow-hidden bg-muted/30">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full"
              >
                <OptimizedImage
                  src={item.image}
                  alt={item.name}
                  aspectRatio="4/3"
                  priority
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-card" />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                <motion.div
                  animate={{ 
                    boxShadow: ['0 0 15px rgba(251,191,36,0.3)', '0 0 30px rgba(251,191,36,0.6)', '0 0 15px rgba(251,191,36,0.3)']
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Badge className="bg-gradient-to-r from-secondary to-accent text-white border-0 gap-2 text-sm font-bold px-4 py-1.5 shadow-xl">
                    <Crown className="h-4 w-4" />
                    Featured
                  </Badge>
                </motion.div>
              </div>
              
              {item.brand && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-sm shadow-lg">
                    {item.brand}
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Content Section */}
            <div className="relative flex-1 p-6 lg:p-8 flex flex-col justify-center">
              <div className="space-y-5">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">{item.name}</h3>
                  <p className="text-muted-foreground mt-2 text-base leading-relaxed">{item.description}</p>
                </div>
                
                {/* Price Section */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-secondary to-accent">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-secondary">
                        {item.price.toLocaleString()}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">$ZSOLAR</span>
                    </div>
                  </div>
                  
                  {!isLoadingBalance && !canAfford && (
                    <div className="flex-1 max-w-xs">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress to redeem</span>
                        <span className="font-semibold">{Math.floor(affordabilityPercent)}%</span>
                      </div>
                      <div className="relative h-2.5 bg-muted/50 rounded-full overflow-hidden">
                        <motion.div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-secondary to-accent rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${affordabilityPercent}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* CTA Button */}
                <Button 
                  size="lg"
                  onClick={() => item.inStock && canAfford && onRedeem(item)} 
                  disabled={!item.inStock || isLoadingBalance || !canAfford}
                  className={`gap-2 w-full sm:w-auto ${
                    canAfford 
                      ? 'bg-gradient-to-r from-secondary to-accent hover:opacity-90 text-white border-0 shadow-xl' 
                      : ''
                  }`}
                  variant={!canAfford && !isLoadingBalance ? "secondary" : "default"}
                >
                  {isLoadingBalance ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Calculating...
                    </>
                  ) : !canAfford ? (
                    <>
                      <TrendingUp className="h-4 w-4" />
                      Need {(item.price - 0).toLocaleString()} more tokens
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
  );
}

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

  const filteredItems = activeTab === "all" 
    ? storeItems 
    : activeTab === "featured"
    ? storeItems.filter(item => item.featured)
    : storeItems.filter(item => item.category === activeTab);
    
  const canAfford = (price: number) => userTokenBalance !== null && userTokenBalance >= price;
  const getAffordabilityPercent = (price: number) => userTokenBalance !== null ? Math.min(100, (userTokenBalance / price) * 100) : 0;

  // Get top featured item for hero
  const heroItem = storeItems.find(item => item.id === "0"); // Tesla Gift Card

  return (
    <div className="min-h-screen">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[60px]" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-violet-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-8">
        {/* Premium Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="relative"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-secondary via-primary to-accent rounded-2xl blur-lg opacity-60"
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
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

        {/* Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-card via-card to-secondary/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-secondary/20 via-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/15 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
            
            <CardContent className="relative py-6 sm:py-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-br from-secondary to-accent rounded-2xl blur opacity-60"
                      animate={{ opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
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

        {/* Featured Hero */}
        {heroItem && activeTab === "all" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <FeaturedHeroCard
              item={heroItem}
              canAfford={canAfford(heroItem.price)}
              affordabilityPercent={getAffordabilityPercent(heroItem.price)}
              isLoadingBalance={isLoadingBalance}
              onRedeem={(item) => setRedeemDialog({ open: true, item })}
            />
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
                    <span>{cat.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        </motion.div>

        {/* Products Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems
              .filter(item => activeTab === "all" ? item.id !== "0" : true)
              .map((item, index) => (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, y: 20, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ delay: index * 0.03, duration: 0.3 }} 
                layout
              >
                <PremiumProductCard
                  item={item}
                  canAfford={canAfford(item.price)}
                  affordabilityPercent={getAffordabilityPercent(item.price)}
                  isLoadingBalance={isLoadingBalance}
                  onRedeem={(item) => setRedeemDialog({ open: true, item })}
                  hoveredItem={hoveredItem}
                  onHover={setHoveredItem}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
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

        {/* Redeem Dialog */}
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
