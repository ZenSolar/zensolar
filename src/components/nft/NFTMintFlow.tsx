import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Wallet,
  Copy,
  Check,
  Zap,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfetti } from '@/hooks/useConfetti';
import { MILESTONE_TO_TOKEN_ID } from '@/lib/nftTokenMapping';
import { getNftArtwork } from '@/lib/nftArtwork';
import type { NFTMilestone } from '@/lib/nftMilestones';

// NFT Contract address on Base Sepolia
const NFT_CONTRACT_ADDRESS = '0xD1d509a48CEbB8f9f9aAA462979D7977c30424E3';

type MintStep = 'confirm' | 'minting' | 'success' | 'error';

interface NFTMintFlowProps {
  milestone: NFTMilestone;
  walletAddress: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMintSuccess?: () => void;
}

interface MintResult {
  txHash: string;
  tokenId: number;
  message: string;
}

// Copy button component
function CopyButton({ 
  text, 
  label,
  className = ''
}: { 
  text: string; 
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center justify-between gap-2 px-4 py-3 bg-background/80 rounded-xl border border-border/50 text-sm font-mono hover:bg-muted/50 hover:border-primary/30 transition-all w-full group shadow-sm ${className}`}
    >
      <span className="truncate">{text}</span>
      {copied ? (
        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
      ) : (
        <Copy className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
      )}
    </button>
  );
}

export function NFTMintFlow({ 
  milestone, 
  walletAddress, 
  open, 
  onOpenChange, 
  onMintSuccess 
}: NFTMintFlowProps) {
  const { triggerCelebration, triggerGoldBurst } = useConfetti();
  
  const [step, setStep] = useState<MintStep>('confirm');
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(4);

  const tokenId = MILESTONE_TO_TOKEN_ID[milestone.id];
  const artwork = getNftArtwork(milestone.id);
  const isWelcome = milestone.id === 'welcome';
  const isCombo = milestone.id.startsWith('combo_');

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep('confirm');
      setMintResult(null);
      setError(null);
      setCountdown(4);
    }
  }, [open]);

  // Countdown timer for auto-redirect to MetaMask instructions
  useEffect(() => {
    if (step === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown]);

  const handleMint = async () => {
    setStep('minting');
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to mint NFTs');
      }

      // Check if user has Welcome NFT (required for other minting)
      const { data: statusData } = await supabase.functions.invoke('mint-onchain', {
        body: {
          action: 'status',
          walletAddress
        }
      });

      const hasWelcomeNFT = statusData?.hasWelcomeNFT;
      const ownedTokenIds: number[] = Array.isArray(statusData?.ownedNFTTokenIds)
        ? statusData.ownedNFTTokenIds
        : [];

      // If already owned, don't error — show success-style import UI instead.
      if (ownedTokenIds.includes(tokenId)) {
        setMintResult({
          txHash: '',
          tokenId,
          message: `${milestone.name} is already on-chain.`,
        });
        setStep('success');
        toast.info('This NFT is already minted. Add it to MetaMask below.');
        onMintSuccess?.();
        return;
      }

      let result: { success: boolean; txHash?: string; message?: string; nftsMinted?: number[] };

      if (isWelcome) {
        // Mint Welcome NFT
        const { data, error: fnError } = await supabase.functions.invoke('mint-onchain', {
          body: {
            action: 'register',
            walletAddress
          }
        });

        if (fnError) throw fnError;
        result = data;
      } else if (!hasWelcomeNFT) {
        throw new Error('You need to claim your Welcome NFT first before minting other NFTs.');
      } else if (isCombo) {
        // Mint combo NFT
        const comboTypeMap: Record<number, string> = {
          34: "2 categories",
          35: "3 categories", 
          36: "5 total NFTs",
          37: "10 total NFTs",
          38: "20 total NFTs",
          39: "30 total NFTs",
          40: "Max 1 category",
          41: "Max all categories",
        };

        const { data, error: fnError } = await supabase.functions.invoke('mint-onchain', {
          body: {
            action: 'mint-combos',
            walletAddress,
            tokenIds: [tokenId],
            comboTypes: [comboTypeMap[tokenId] || "combo"]
          }
        });

        if (fnError) throw fnError;
        result = data;
      } else {
        // Mint milestone NFT
        const { data, error: fnError } = await supabase.functions.invoke('mint-onchain', {
          body: {
            action: 'claim-milestone-nfts',
            walletAddress,
            specificTokenId: tokenId
          }
        });

        if (fnError) throw fnError;
        
        // Check if our specific NFT was minted
        const wasMinted = data.nftsMinted?.includes(tokenId);
        if (!wasMinted) {
          // If it wasn't newly minted, it's either already owned or not eligible yet.
          // (Already-owned case is handled above, but keep this defensive.)
          if (Array.isArray(statusData?.ownedNFTTokenIds) && statusData.ownedNFTTokenIds.includes(tokenId)) {
            setMintResult({ txHash: '', tokenId, message: `${milestone.name} is already on-chain.` });
            setStep('success');
            toast.info('This NFT is already minted. Add it to MetaMask below.');
            onMintSuccess?.();
            return;
          }
          throw new Error(data.message || 'NFT is not eligible to mint right now.');
        }
        result = data;
      }

      if (!result?.success) {
        throw new Error(result?.message || 'Minting failed');
      }

      // Success!
      setMintResult({
        txHash: result.txHash || '',
        tokenId: tokenId,
        message: `${milestone.name} NFT minted successfully!`
      });
      setStep('success');

      // Trigger confetti
      triggerGoldBurst();
      setTimeout(() => triggerCelebration(), 200);

      onMintSuccess?.();

    } catch (err: any) {
      console.error('Mint error:', err);
      setError(err.message || 'Failed to mint NFT. Please try again.');
      setStep('error');
    }
  };

  const openMetaMaskInfo = () => {
    // Close the dialog to show the MetaMask import instructions
    // The user has already copied the info
    onOpenChange(false);
    toast.info('Open MetaMask → NFTs tab → Import NFT, then paste the contract address and Token ID');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0">
        <AnimatePresence mode="wait">
          {/* STEP 1: Confirmation */}
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 space-y-5"
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm">
                    <Zap className="h-5 w-5 text-primary" />
                  </span>
                  <span>Mint NFT</span>
                </DialogTitle>
                <DialogDescription className="pt-1">
                  You're about to mint this collectible to your wallet on Base Sepolia
                </DialogDescription>
              </DialogHeader>

              {/* NFT Preview */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/50 shadow-sm">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex-shrink-0 shadow-lg ring-2 ring-primary/10">
                  {artwork && (
                    <img 
                      src={artwork} 
                      alt={milestone.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg leading-tight">{milestone.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{milestone.description}</p>
                  <Badge variant="secondary" className="mt-2 text-xs font-mono">
                    Token ID: {tokenId}
                  </Badge>
                </div>
              </div>

              {/* Wallet Info */}
              <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/20 flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Minting to wallet</p>
                  <p className="font-mono text-sm font-medium truncate">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</p>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
                  Cancel
                </Button>
                <Button onClick={handleMint} className="gap-2 flex-1 sm:flex-none bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                  <Zap className="h-4 w-4" />
                  Confirm Mint
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* STEP 2: Minting in Progress */}
          {step === 'minting' && (
            <motion.div
              key="minting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-12 px-6 text-center space-y-8"
            >
              {/* Animated NFT */}
              <div className="relative w-36 h-36 mx-auto">
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden shadow-2xl ring-4 ring-primary/10"
                  animate={{ 
                    boxShadow: [
                      '0 0 0 0 hsl(var(--primary) / 0)',
                      '0 0 40px 15px hsl(var(--primary) / 0.2)',
                      '0 0 0 0 hsl(var(--primary) / 0)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {artwork && (
                    <img 
                      src={artwork} 
                      alt={milestone.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </motion.div>
                <motion.div 
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-background rounded-full p-2 shadow-lg"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="h-6 w-6 text-primary" />
                </motion.div>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Minting on Blockchain</h3>
                <p className="text-sm text-muted-foreground">
                  Transaction in progress. Please wait...
                </p>
              </div>

              {/* Transaction Steps */}
              <div className="space-y-3 text-left max-w-xs mx-auto bg-muted/30 rounded-xl p-4 border border-border/50">
                <motion.div 
                  className="flex items-center gap-3 text-sm"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <span className="font-medium">Verifying eligibility</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-3 text-sm"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  </div>
                  <span className="text-muted-foreground">Submitting transaction...</span>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Success */}
          {step === 'success' && mintResult && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 px-6 text-center space-y-6"
            >
              {/* Animated Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="relative w-28 h-28 mx-auto"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center shadow-xl ring-4 ring-green-500/10">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                  >
                    <CheckCircle2 className="h-14 w-14 text-green-500" />
                  </motion.div>
                </div>
                <motion.div
                  className="absolute inset-0"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="absolute top-0 right-0 h-5 w-5 text-amber-400" />
                  <Sparkles className="absolute bottom-0 left-0 h-4 w-4 text-primary" />
                </motion.div>
              </motion.div>

              <div>
                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {mintResult.txHash ? 'NFT Minted Successfully!' : 'NFT Already On-Chain'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {mintResult.txHash ? milestone.name : 'This collectible is already in your wallet. Add it to MetaMask below.'}
                </p>
              </div>

              {/* Transaction Hash */}
              {mintResult.txHash && (
                <a
                  href={`https://sepolia.basescan.org/tx/${mintResult.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline bg-primary/5 px-4 py-2 rounded-full transition-colors hover:bg-primary/10"
                >
                  View Transaction <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}

              {/* MetaMask Import Info */}
              <div className="p-5 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/50 space-y-4 text-left shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">Add to MetaMask</span>
                    <p className="text-xs text-muted-foreground">Copy these values to import your NFT</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Contract Address</label>
                    <CopyButton text={NFT_CONTRACT_ADDRESS} label="Contract Address" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Collectible ID</label>
                    <CopyButton text={String(mintResult.tokenId)} label="Collectible ID" />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center pt-1">
                  Redirecting to instructions in <span className="font-mono font-semibold text-foreground">{countdown}s</span>
                </p>
              </div>

              <Button onClick={openMetaMaskInfo} className="w-full gap-2 bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/20">
                <Wallet className="h-4 w-4" />
                Open MetaMask Instructions
              </Button>
            </motion.div>
          )}

          {/* STEP 4: Error */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-10 px-6 text-center space-y-6"
            >
              <motion.div 
                className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center ring-4 ring-destructive/10"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
              >
                <AlertCircle className="h-10 w-10 text-destructive" />
              </motion.div>

              <div>
                <h3 className="text-2xl font-bold text-destructive mb-3">
                  Minting Failed
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto bg-muted/30 rounded-lg p-3 border border-border/50">{error}</p>
              </div>

              <DialogFooter className="justify-center pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="min-w-[100px]">
                  Close
                </Button>
                <Button onClick={() => setStep('confirm')} className="min-w-[100px] bg-gradient-to-r from-primary to-primary/90">
                  Try Again
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
