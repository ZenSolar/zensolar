import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sun, Wallet, Zap, CheckCircle2, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import zenLogo from "@/assets/zen-logo-full-new.jpeg";

const steps = [
  {
    id: 1,
    title: "Welcome to ZenSolar",
    description: "Let's set up your account to start earning rewards for your clean energy.",
    icon: Sparkles,
    content: (
      <div className="space-y-4 text-center">
        <img src={zenLogo} alt="ZenSolar" className="h-20 mx-auto rounded-xl" />
        <p className="text-muted-foreground">
          ZenSolar tracks your solar production, EV miles, and sustainable actions 
          to reward you with blockchain-verified tokens and NFTs.
        </p>
        <div className="grid grid-cols-3 gap-3 pt-4">
          <div className="text-center p-3 rounded-lg bg-primary/5">
            <Sun className="h-6 w-6 mx-auto text-solar mb-1" />
            <p className="text-xs text-muted-foreground">Track Solar</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/5">
            <Zap className="h-6 w-6 mx-auto text-energy mb-1" />
            <p className="text-xs text-muted-foreground">Earn Tokens</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/5">
            <Wallet className="h-6 w-6 mx-auto text-token mb-1" />
            <p className="text-xs text-muted-foreground">Mint NFTs</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: "Connect Your Solar System",
    description: "Link your solar provider to automatically track energy production.",
    icon: Sun,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          We support the most popular solar monitoring systems. Connect your account 
          to start earning rewards for every kilowatt-hour you produce.
        </p>
        <div className="space-y-3">
          {[
            { name: "Enphase", desc: "Monitor microinverter production" },
            { name: "Tesla", desc: "Solar + Powerwall integration" },
            { name: "SolarEdge", desc: "Optimizer-level monitoring" },
          ].map((provider) => (
            <div key={provider.name} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sun className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{provider.name}</p>
                <p className="text-xs text-muted-foreground">{provider.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          You can connect these from your Dashboard after completing setup.
        </p>
      </div>
    ),
  },
  {
    id: 3,
    title: "Connect Your Wallet",
    description: "Link a crypto wallet to receive your token rewards and NFTs.",
    icon: Wallet,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Your rewards are minted directly to your wallet. We support any Ethereum-compatible wallet.
        </p>
        <div className="space-y-3">
          {[
            { name: "MetaMask", desc: "Popular browser wallet" },
            { name: "WalletConnect", desc: "Connect mobile wallets" },
            { name: "Coinbase Wallet", desc: "Easy-to-use option" },
          ].map((wallet) => (
            <div key={wallet.name} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-lg bg-token/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-token" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{wallet.name}</p>
                <p className="text-xs text-muted-foreground">{wallet.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Don't have a wallet? You can set one up from your Dashboard.
        </p>
      </div>
    ),
  },
  {
    id: 4,
    title: "You're All Set!",
    description: "Your account is ready. Start tracking and earning.",
    icon: CheckCircle2,
    content: (
      <div className="space-y-6 text-center">
        <div className="h-20 w-20 rounded-full bg-eco/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10 text-eco" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Welcome to ZenSolar!</h3>
          <p className="text-sm text-muted-foreground">
            Head to your Dashboard to connect your solar system and wallet. 
            Once connected, you'll automatically start earning rewards.
          </p>
        </div>
        <div className="bg-primary/5 rounded-lg p-4">
          <p className="text-sm font-medium">🧪 Beta Reminder</p>
          <p className="text-xs text-muted-foreground mt-1">
            All rewards are on Sepolia testnet during beta. They have no monetary value 
            but will track your early contributions!
          </p>
        </div>
      </div>
    ),
  },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      navigate("/");
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            {!isLastStep && (
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip
              </Button>
            )}
          </div>
          <Progress value={progress} className="h-1 mb-4" />
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <step.icon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{step.title}</CardTitle>
          <CardDescription>{step.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step.content}
          
          <div className="flex gap-3">
            {!isFirstStep && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            <Button onClick={handleNext} className={isFirstStep ? "w-full" : "flex-1"}>
              {isLastStep ? "Go to Dashboard" : "Continue"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
