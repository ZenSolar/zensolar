import { useState } from "react";
import { ShoppingBag, Zap, Gift, Shirt, Headphones, Watch, Battery, Sun, Star, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

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
  // Electronics
  {
    id: "1",
    name: "Wireless Earbuds Pro",
    description: "Premium noise-canceling earbuds with 30hr battery life",
    price: 2500,
    category: "electronics",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=300&fit=crop",
    icon: Headphones,
    inStock: true,
    featured: true,
  },
  {
    id: "2",
    name: "Smart Watch",
    description: "Solar-powered smartwatch with health tracking",
    price: 4500,
    category: "electronics",
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=300&fit=crop",
    icon: Watch,
    inStock: true,
  },
  {
    id: "3",
    name: "Portable Power Bank",
    description: "20,000mAh solar-compatible power bank",
    price: 1200,
    category: "electronics",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=300&fit=crop",
    icon: Battery,
    inStock: true,
  },
  // Merch
  {
    id: "4",
    name: "ZenSolar T-Shirt",
    description: "100% organic cotton tee with ZenSolar logo",
    price: 500,
    category: "merch",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop",
    icon: Shirt,
    inStock: true,
  },
  {
    id: "5",
    name: "ZenSolar Hoodie",
    description: "Premium eco-friendly hoodie",
    price: 1200,
    category: "merch",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=300&fit=crop",
    icon: Shirt,
    inStock: true,
    featured: true,
  },
  {
    id: "6",
    name: "Solar Cap",
    description: "Adjustable cap with embroidered sun logo",
    price: 350,
    category: "merch",
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=300&fit=crop",
    icon: Sun,
    inStock: false,
  },
  // Energy rewards
  {
    id: "7",
    name: "NFT Badge: Solar Pioneer",
    description: "Exclusive digital collectible for early adopters",
    price: 1000,
    category: "energy",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop",
    icon: Star,
    inStock: true,
  },
  {
    id: "8",
    name: "Carbon Offset Certificate",
    description: "Offset 1 ton of CO2 emissions",
    price: 800,
    category: "energy",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=300&fit=crop",
    icon: Sun,
    inStock: true,
  },
];

export default function Store() {
  const [activeTab, setActiveTab] = useState("all");
  const userTokenBalance = 3250; // This would come from user's actual balance

  const filteredItems = activeTab === "all" 
    ? storeItems 
    : storeItems.filter(item => item.category === activeTab);

  const handleRedeem = (item: StoreItem) => {
    if (!item.inStock) {
      toast.error("This item is currently out of stock");
      return;
    }
    if (userTokenBalance < item.price) {
      toast.error("Insufficient $ZSOLAR balance");
      return;
    }
    toast.success(`Redemption request submitted for ${item.name}!`, {
      description: "We'll notify you when your order is processed.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <ShoppingBag className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Rewards Store</h1>
        </div>
        <p className="text-muted-foreground">
          Redeem your $ZSOLAR tokens for exclusive products and rewards
        </p>
      </div>

      {/* Balance Card */}
      <Card className="mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/20">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Balance</p>
              <p className="text-2xl font-bold">{userTokenBalance.toLocaleString()} $ZSOLAR</p>
            </div>
          </div>
          <Button variant="outline" className="gap-2">
            <Gift className="h-4 w-4" />
            Earn More
          </Button>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="electronics">Electronics</TabsTrigger>
          <TabsTrigger value="merch">Merch</TabsTrigger>
          <TabsTrigger value="energy">Energy</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <Card 
            key={item.id} 
            className={`overflow-hidden transition-all hover:shadow-lg ${
              item.featured ? "ring-2 ring-primary/50" : ""
            } ${!item.inStock ? "opacity-75" : ""}`}
          >
            <div className="relative">
              <img 
                src={item.image} 
                alt={item.name}
                className="w-full h-48 object-cover"
              />
              {item.featured && (
                <Badge className="absolute top-2 right-2 bg-primary">
                  Featured
                </Badge>
              )}
              {!item.inStock && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Out of Stock
                  </Badge>
                </div>
              )}
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {item.description}
                  </CardDescription>
                </div>
                <item.icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>
            </CardHeader>
            <CardFooter className="flex items-center justify-between pt-0">
              <div className="flex items-center gap-1 text-primary font-semibold">
                <Zap className="h-4 w-4" />
                {item.price.toLocaleString()}
              </div>
              <Button 
                size="sm" 
                onClick={() => handleRedeem(item)}
                disabled={!item.inStock || userTokenBalance < item.price}
                variant={userTokenBalance < item.price ? "secondary" : "default"}
              >
                {userTokenBalance < item.price ? "Need More" : "Redeem"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No items found</h3>
          <p className="text-muted-foreground">Check back soon for new products!</p>
        </div>
      )}

      {/* Coming Soon Section */}
      <div className="mt-12 text-center">
        <h3 className="text-lg font-medium mb-2">More Rewards Coming Soon!</h3>
        <p className="text-muted-foreground text-sm">
          We're adding new products regularly. Keep earning $ZSOLAR to unlock exclusive rewards.
        </p>
      </div>
    </div>
  );
}
