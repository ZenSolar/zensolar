import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Zap, Coins, Leaf, Users, Globe, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import zenLogo from "@/assets/zen-logo-full-new.jpeg";

const features = [
  {
    icon: Sun,
    title: "Solar Tracking",
    description: "Connect your Enphase, Tesla, or SolarEdge system to automatically track energy production.",
  },
  {
    icon: Zap,
    title: "EV Integration",
    description: "Log electric vehicle miles and charging to earn additional rewards for clean transportation.",
  },
  {
    icon: Coins,
    title: "Token Rewards",
    description: "Earn $ZSOLAR tokens proportional to your verified clean energy production.",
  },
  {
    icon: Leaf,
    title: "NFT Milestones",
    description: "Unlock unique NFTs as you hit sustainability milestones like 1000 kWh or 10,000 miles.",
  },
];

const stats = [
  { value: "Beta", label: "Current Phase" },
  { value: "Sepolia", label: "Test Network" },
  { value: "3", label: "Solar Providers" },
  { value: "∞", label: "Potential Impact" },
];

export default function About() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-6 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <img 
          src={zenLogo} 
          alt="ZenSolar" 
          width={160}
          height={64}
          className="h-16 mx-auto rounded-lg"
        />
        <h1 className="text-3xl font-bold text-foreground">
          Turn Sunshine into <span className="text-gradient-solar">Rewards</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          ZenSolar rewards you for generating and using clean energy. Connect your solar system, 
          track your impact, and earn blockchain-verified tokens and NFTs.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="text-center">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mission */}
      <Card className="bg-gradient-to-br from-primary/5 to-eco/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Our Mission
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>
            Climate change is the defining challenge of our generation. While governments and corporations 
            debate solutions, millions of homeowners are already taking action by installing solar panels, 
            driving electric vehicles, and making sustainable choices.
          </p>
          <p>
            ZenSolar exists to recognize and reward these everyday climate heroes. By connecting your 
            clean energy sources to our platform, you earn verifiable, on-chain rewards that represent 
            your positive impact on the planet.
          </p>
        </CardContent>
      </Card>

      {/* How It Works */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-center">How It Works</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Beta Notice */}
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardHeader>
          <CardTitle className="text-lg">🧪 Beta Program</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            ZenSolar is currently in beta on the Sepolia testnet. This means:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Tokens and NFTs have no monetary value during beta</li>
            <li>We're refining tokenomics based on community feedback</li>
            <li>Your feedback directly shapes the product</li>
            <li>Early testers will be recognized when we launch on mainnet</li>
          </ul>
        </CardContent>
      </Card>

      {/* Team */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            The Team
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p>
            ZenSolar is built by a passionate team of climate tech enthusiasts, blockchain developers, 
            and renewable energy advocates. We believe in the power of decentralized incentives to 
            accelerate the transition to clean energy.
          </p>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold">Ready to Start Earning?</h2>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link to="/">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/tokenomics">
              View Tokenomics
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
