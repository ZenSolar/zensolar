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
import { useHaptics } from '@/hooks/useHaptics';
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
  const { success: hapticSuccess } = useHaptics();
  
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

      // Check what NFTs user already owns (to avoid double-minting)
      const { data: statusData } = await supabase.functions.invoke('mint-onchain', {
        body: {
          action: 'status',
          walletAddress
        }
      });

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

      // Trigger confetti and haptic feedback
      triggerGoldBurst();
      setTimeout(() => triggerCelebration(), 200);
      hapticSuccess();

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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* STEP 1: Confirmation */}
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <motion.span 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                  >
                    <Zap className="h-5 w-5 text-primary" />
                  </motion.span>
                  <span className="text-xl">Mint NFT</span>
                </DialogTitle>
                <DialogDescription className="pt-1.5 text-muted-foreground/80">
                  Claim this collectible to your wallet on Base Sepolia
                </DialogDescription>
              </DialogHeader>

              {/* NFT Preview Card */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="relative flex items-center gap-4 p-4 bg-gradient-to-br from-muted/60 via-muted/40 to-muted/20 rounded-2xl border border-border/60 shadow-sm overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex-shrink-0 shadow-xl ring-2 ring-white/10 dark:ring-white/5">
                  {artwork && (
                    <img 
                      src={artwork} 
                      alt={milestone.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="relative flex-1 min-w-0">
                  <h3 className="font-bold text-lg leading-tight">{milestone.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{milestone.description}</p>
                  <Badge variant="secondary" className="mt-2.5 text-xs font-mono bg-background/60 backdrop-blur-sm">
                    Token ID: {tokenId}
                  </Badge>
                </div>
              </motion.div>

              {/* Wallet Info */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-3.5 bg-gradient-to-r from-primary/8 via-primary/5 to-primary/3 rounded-xl border border-primary/15 flex items-center gap-3"
              >
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-sm">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Minting to wallet</p>
                  <p className="font-mono text-sm font-semibold truncate">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</p>
                </div>
              </motion.div>

              <DialogFooter className="pt-3 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)} 
                  className="flex-1 sm:flex-none h-11 rounded-xl border-border/60 hover:bg-muted/60"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleMint} 
                  className="gap-2 flex-1 sm:flex-none h-11 rounded-xl bg-gradient-to-r from-primary via-primary to-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] transition-all duration-200"
                >
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
              transition={{ duration: 0.25 }}
              className="py-10 text-center space-y-8"
            >
              {/* Animated NFT with Glow */}
              <div className="relative w-40 h-40 mx-auto">
                {/* Outer glow ring */}
                <motion.div
                  className="absolute inset-[-8px] rounded-3xl"
                  animate={{ 
                    boxShadow: [
                      '0 0 20px 0 hsl(var(--primary) / 0.15)',
                      '0 0 50px 10px hsl(var(--primary) / 0.25)',
                      '0 0 20px 0 hsl(var(--primary) / 0.15)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                
                {/* NFT Image Container */}
                <motion.div
                  className="relative w-full h-full rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 overflow-hidden shadow-2xl ring-2 ring-primary/20"
                  animate={{ 
                    scale: [1, 1.02, 1],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {artwork && (
                    <img 
                      src={artwork} 
                      alt={milestone.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Shimmer overlay */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                  />
                </motion.div>
                
                {/* Spinning loader badge */}
                <motion.div 
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-background rounded-full p-2.5 shadow-xl ring-2 ring-primary/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="h-6 w-6 text-primary" />
                </motion.div>
              </div>

              <div className="space-y-2">
                <motion.h3 
                  className="text-2xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Minting on Blockchain
                </motion.h3>
                <p className="text-sm text-muted-foreground">
                  Your transaction is being processed...
                </p>
              </div>

              {/* Transaction Progress Steps */}
              <div className="space-y-3 text-left max-w-xs mx-auto bg-gradient-to-br from-muted/40 to-muted/20 rounded-2xl p-5 border border-border/50 shadow-sm">
                <motion.div 
                  className="flex items-center gap-3 text-sm"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <motion.div 
                    className="h-7 w-7 rounded-full bg-gradient-to-br from-green-500/25 to-green-500/10 flex items-center justify-center ring-1 ring-green-500/30"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring' }}
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </motion.div>
                  <span className="font-medium text-foreground">Eligibility verified</span>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-3 text-sm"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center ring-1 ring-primary/30">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  </div>
                  <span className="text-muted-foreground">Submitting to blockchain...</span>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-3 text-sm"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 0.4, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.3 }}
                >
                  <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center ring-1 ring-border/50">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  </div>
                  <span className="text-muted-foreground/50">Confirming transaction</span>
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
              transition={{ duration: 0.3, type: 'spring', damping: 20 }}
              className="py-6 text-center space-y-5"
            >
              {/* Animated Success Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, delay: 0.1 }}
                className="relative w-28 h-28 mx-auto"
              >
                {/* Glow effect */}
                <div className="absolute inset-[-4px] rounded-full bg-gradient-to-br from-green-500/20 via-green-500/10 to-transparent blur-lg" />
                
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-green-500/25 via-green-500/15 to-green-500/5 flex items-center justify-center shadow-2xl ring-2 ring-green-500/20">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.3, damping: 10 }}
                  >
                    <CheckCircle2 className="h-14 w-14 text-green-500 drop-shadow-lg" />
                  </motion.div>
                </div>
                
                {/* Orbiting sparkles */}
                <motion.div
                  className="absolute inset-0"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="absolute -top-1 right-1 h-5 w-5 text-amber-400 drop-shadow-lg" />
                  <Sparkles className="absolute bottom-2 -left-1 h-4 w-4 text-primary drop-shadow-lg" />
                  <Sparkles className="absolute top-1/2 -right-2 h-3 w-3 text-green-400 drop-shadow-lg" />
                </motion.div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 dark:from-green-400 dark:to-green-300 bg-clip-text text-transparent">
                  {mintResult.txHash ? 'NFT Minted Successfully!' : 'NFT Already On-Chain'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                  {mintResult.txHash 
                    ? `${milestone.name} has been minted to your wallet`
                    : 'This collectible is already in your wallet. Add it to MetaMask below.'
                  }
                </p>
              </motion.div>

              {/* Transaction Hash Link */}
              {mintResult.txHash && (
                <motion.a
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  href={`https://sepolia.basescan.org/tx/${mintResult.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 bg-primary/8 hover:bg-primary/12 px-5 py-2.5 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  View on BaseScan <ExternalLink className="h-3.5 w-3.5" />
                </motion.a>
              )}

              {/* MetaMask Import Card */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="relative p-5 bg-gradient-to-br from-muted/60 via-muted/40 to-muted/20 rounded-2xl border border-border/60 space-y-4 text-left shadow-sm overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />
                
                <div className="relative flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-sm ring-1 ring-primary/20">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold text-base">Add to MetaMask</span>
                    <p className="text-xs text-muted-foreground">Copy these to import your NFT</p>
                  </div>
                </div>
                
                <div className="relative space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Contract Address</label>
                    <CopyButton text={NFT_CONTRACT_ADDRESS} label="Contract Address" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Token ID</label>
                    <CopyButton text={String(mintResult.tokenId)} label="Token ID" />
                  </div>
                </div>

                <div className="relative flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span>
                    Auto-redirect in <span className="font-mono font-semibold text-foreground">{countdown}s</span>
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button 
                  onClick={openMetaMaskInfo} 
                  className="w-full h-12 gap-2 rounded-xl bg-gradient-to-r from-primary via-primary to-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.01] transition-all duration-200"
                >
                  <Wallet className="h-4 w-4" />
                  Open MetaMask Instructions
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 4: Error */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="py-8 text-center space-y-6"
            >
              {/* Error Icon with shake animation */}
              <motion.div 
                className="relative w-24 h-24 mx-auto"
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 10 }}
              >
                {/* Glow effect */}
                <div className="absolute inset-[-4px] rounded-full bg-gradient-to-br from-destructive/20 via-destructive/10 to-transparent blur-lg" />
                
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-destructive/20 via-destructive/10 to-destructive/5 flex items-center justify-center ring-2 ring-destructive/20 shadow-xl">
                  <motion.div
                    animate={{ 
                      x: [0, -3, 3, -3, 3, 0],
                    }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <AlertCircle className="h-12 w-12 text-destructive drop-shadow-lg" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-4"
              >
                <h3 className="text-2xl font-bold bg-gradient-to-r from-destructive to-destructive/80 bg-clip-text text-transparent">
                  Minting Failed
                </h3>
                <div className="max-w-sm mx-auto bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent rounded-xl p-4 border border-destructive/20">
                  <p className="text-sm text-muted-foreground leading-relaxed">{error}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <DialogFooter className="justify-center pt-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => onOpenChange(false)} 
                    className="min-w-[110px] h-11 rounded-xl border-border/60 hover:bg-muted/60"
                  >
                    Close
                  </Button>
                  <Button 
                    onClick={() => setStep('confirm')} 
                    className="min-w-[110px] h-11 rounded-xl bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-200"
                  >
                    Try Again
                  </Button>
                </DialogFooter>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
