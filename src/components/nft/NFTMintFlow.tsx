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
      className={`flex items-center justify-between gap-2 px-4 py-3 bg-background rounded-lg border border-border text-sm font-mono hover:bg-muted transition-colors w-full ${className}`}
    >
      <span className="truncate">{text}</span>
      {copied ? (
        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
      ) : (
        <Copy className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
      <DialogContent className="sm:max-w-md overflow-hidden">
        <AnimatePresence mode="wait">
          {/* STEP 1: Confirmation */}
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Mint NFT
                </DialogTitle>
                <DialogDescription>
                  You're about to mint this NFT to your wallet on Base Sepolia
                </DialogDescription>
              </DialogHeader>

              {/* NFT Preview */}
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex-shrink-0">
                  {artwork && (
                    <img 
                      src={artwork} 
                      alt={milestone.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg">{milestone.name}</h3>
                  <p className="text-sm text-muted-foreground">{milestone.description}</p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    Token ID: {tokenId}
                  </Badge>
                </div>
              </div>

              {/* Wallet Info */}
              <div className="p-3 bg-accent/10 rounded-lg border border-accent/20 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-accent" />
                <span className="text-xs text-muted-foreground">
                  Minting to: <span className="font-mono text-foreground">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                </span>
              </div>

              <DialogFooter className="flex gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleMint} className="gap-2">
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
              className="py-8 text-center space-y-6"
            >
              {/* Animated NFT */}
              <div className="relative w-32 h-32 mx-auto">
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden"
                  animate={{ 
                    boxShadow: [
                      '0 0 0 0 rgba(var(--primary), 0)',
                      '0 0 30px 10px rgba(var(--primary), 0.3)',
                      '0 0 0 0 rgba(var(--primary), 0)'
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
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="h-8 w-8 text-primary" />
                </motion.div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2">Minting on Blockchain</h3>
                <p className="text-sm text-muted-foreground">
                  Transaction in progress. Please wait...
                </p>
              </div>

              {/* Transaction Steps */}
              <div className="space-y-2 text-left max-w-xs mx-auto">
                <motion.div 
                  className="flex items-center gap-2 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Verifying eligibility</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
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
              className="py-4 text-center space-y-5"
            >
              {/* Animated Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="relative w-24 h-24 mx-auto"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                  >
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                  </motion.div>
                </div>
                <motion.div
                  className="absolute inset-0"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="absolute top-0 right-0 h-4 w-4 text-amber-400" />
                  <Sparkles className="absolute bottom-0 left-0 h-3 w-3 text-primary" />
                </motion.div>
              </motion.div>

              <div>
                <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {mintResult.txHash ? 'NFT Minted Successfully!' : 'NFT Already On-Chain'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {mintResult.txHash ? milestone.name : 'This collectible is already in your wallet. Add it to MetaMask below.'}
                </p>
              </div>

              {/* Transaction Hash */}
              {mintResult.txHash && (
                <a
                  href={`https://sepolia.basescan.org/tx/${mintResult.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View Transaction <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {/* MetaMask Import Info */}
              <div className="p-4 bg-muted/50 rounded-xl border border-border/50 space-y-4 text-left">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Add to MetaMask</span>
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

                <p className="text-xs text-muted-foreground text-center">
                  Redirecting to instructions in {countdown}s...
                </p>
              </div>

              <Button onClick={openMetaMaskInfo} className="w-full gap-2">
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
              className="py-6 text-center space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-destructive mb-2">
                  Minting Failed
                </h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>

              <DialogFooter className="flex gap-2 sm:gap-0 justify-center">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button onClick={() => setStep('confirm')}>
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
