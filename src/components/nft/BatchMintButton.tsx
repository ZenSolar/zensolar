import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Wallet,
  Copy,
  Check,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfetti } from '@/hooks/useConfetti';
import { MILESTONE_TO_TOKEN_ID } from '@/lib/nftTokenMapping';
import { getNftArtwork } from '@/lib/nftArtwork';
import type { NFTMilestone } from '@/lib/nftMilestones';

// NFT Contract address on Base Sepolia
const NFT_CONTRACT_ADDRESS = '0xD1d509a48CEbB8f9f9aAA462979D7977c30424E3';

interface BatchMintButtonProps {
  earnedMilestones: NFTMilestone[];
  onMintComplete?: () => void;
}

interface EligibleNFT {
  tokenId: number;
  name: string;
  category: string;
  milestoneId: string;
}

interface MintResult {
  success: boolean;
  txHash?: string;
  tokenId: number;
  nftName: string;
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
      className={`flex items-center justify-between gap-2 px-3 py-2 bg-background rounded-md border border-border text-xs font-mono hover:bg-muted transition-colors w-full ${className}`}
    >
      <span className="truncate">{text}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      )}
    </button>
  );
}

export function BatchMintButton({ earnedMilestones, onMintComplete }: BatchMintButtonProps) {
  const { address, isConnected } = useAccount();
  const { triggerCelebration, triggerGoldBurst } = useConfetti();
  
  const [isChecking, setIsChecking] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [eligibleNFTs, setEligibleNFTs] = useState<EligibleNFT[]>([]);
  const [ownedTokenIds, setOwnedTokenIds] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate which earned NFTs are not yet on-chain
  const getEligibleForMint = (): EligibleNFT[] => {
    const ownedSet = new Set(ownedTokenIds);
    const eligible: EligibleNFT[] = [];
    
    for (const milestone of earnedMilestones) {
      const tokenId = MILESTONE_TO_TOKEN_ID[milestone.id];
      if (tokenId !== undefined && !ownedSet.has(tokenId)) {
        let category = 'milestone';
        if (milestone.id.startsWith('solar_')) category = 'solar';
        else if (milestone.id.startsWith('battery_')) category = 'battery';
        else if (milestone.id.startsWith('charge_')) category = 'charging';
        else if (milestone.id.startsWith('ev_')) category = 'ev';
        else if (milestone.id.startsWith('combo_')) category = 'combo';
        else if (milestone.id === 'welcome') category = 'welcome';
        
        eligible.push({
          tokenId,
          name: milestone.name,
          category,
          milestoneId: milestone.id
        });
      }
    }
    
    return eligible;
  };

  // Check on-chain status when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      checkOnChainStatus();
    }
  }, [isConnected, address, earnedMilestones.length]);

  const checkOnChainStatus = async () => {
    if (!address) return;
    
    setIsChecking(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsChecking(false);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('mint-onchain', {
        body: {
          action: 'status',
          walletAddress: address
        }
      });

      if (fnError) {
        console.log('Status check error (wallet may not be registered yet):', fnError);
        setOwnedTokenIds([]);
        setEligibleNFTs(getEligibleForMint());
        setIsChecking(false);
        return;
      }
      
      setOwnedTokenIds(data?.ownedNFTTokenIds || []);
      setEligibleNFTs(getEligibleForMint());
    } catch (err) {
      console.error('Error checking on-chain status:', err);
    } finally {
      setIsChecking(false);
    }
  };

  // Update eligible NFTs when owned tokens change
  useEffect(() => {
    const eligible = getEligibleForMint();
    setEligibleNFTs(eligible);
    // Reset index if it's out of bounds
    if (currentIndex >= eligible.length) {
      setCurrentIndex(0);
    }
  }, [ownedTokenIds, earnedMilestones]);

  const currentNFT = eligibleNFTs[currentIndex];

  const handleMint = async () => {
    if (!address || !currentNFT) return;
    
    setIsMinting(true);
    setMintResult(null);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please sign in to mint NFTs');
        setIsMinting(false);
        return;
      }

      // Determine mint action based on NFT type
      const isWelcome = currentNFT.category === 'welcome';
      const isCombo = currentNFT.category === 'combo';

      if (isWelcome) {
        // Mint Welcome NFT
        const { data, error: fnError } = await supabase.functions.invoke('mint-onchain', {
          body: {
            action: 'register',
            walletAddress: address
          }
        });

        if (fnError) throw fnError;
        if (!data?.success) {
          throw new Error(data?.message || 'Welcome NFT minting failed');
        }

        setMintResult({
          success: true,
          txHash: data.txHash,
          tokenId: 0,
          nftName: 'Welcome',
          message: 'Welcome NFT minted successfully!'
        });
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
            walletAddress: address,
            tokenIds: [currentNFT.tokenId],
            comboTypes: [comboTypeMap[currentNFT.tokenId] || "combo"]
          }
        });

        if (fnError) throw fnError;
        
        setMintResult({
          success: true,
          txHash: data.txHash,
          tokenId: currentNFT.tokenId,
          nftName: currentNFT.name,
          message: `${currentNFT.name} minted successfully!`
        });
      } else {
        // Mint milestone NFT - the edge function will determine which NFTs to mint
        // We'll request just this one by passing the specific token ID
        const { data, error: fnError } = await supabase.functions.invoke('mint-onchain', {
          body: {
            action: 'claim-milestone-nfts',
            walletAddress: address,
            specificTokenId: currentNFT.tokenId
          }
        });

        if (fnError) throw fnError;
        
        // Check if our specific NFT was minted
        const wasMinted = data.nftsMinted?.includes(currentNFT.tokenId);
        
        if (wasMinted) {
          setMintResult({
            success: true,
            txHash: data.txHash,
            tokenId: currentNFT.tokenId,
            nftName: currentNFT.name,
            message: `${currentNFT.name} minted successfully!`
          });
        } else {
          throw new Error('NFT was not minted. It may already be on-chain.');
        }
      }

      // Trigger celebration
      triggerGoldBurst();
      setTimeout(() => triggerCelebration(), 200);
      
      // Refresh on-chain status
      await checkOnChainStatus();
      onMintComplete?.();

    } catch (err: any) {
      console.error('Mint error:', err);
      setError(err.message || 'Failed to mint NFT. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  const handleNext = () => {
    setMintResult(null);
    setError(null);
    // Move to next eligible NFT, or wrap around
    if (currentIndex < eligibleNFTs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
      checkOnChainStatus(); // Refresh to get updated list
    }
  };

  const remainingCount = eligibleNFTs.length;

  if (!isConnected) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="p-4 text-center">
          <Wallet className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Connect your wallet to mint NFTs on-chain
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden transition-all ${
      remainingCount > 0 
        ? 'border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10' 
        : 'border-border/50 bg-muted/30'
    }`}>
      <CardContent className="p-4">
        <AnimatePresence mode="wait">
          {isChecking ? (
            <motion.div
              key="checking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-4"
            >
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Checking on-chain status...</span>
            </motion.div>
          ) : mintResult ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Success message */}
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">{mintResult.message}</span>
              </div>

              {/* Transaction link */}
              {mintResult.txHash && (
                <a
                  href={`https://sepolia.basescan.org/tx/${mintResult.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  View transaction <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {/* MetaMask Import Section */}
              <div className="p-3 bg-muted/50 rounded-lg border border-border/50 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span>Add to MetaMask</span>
                </div>
                
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Contract Address</label>
                    <CopyButton text={NFT_CONTRACT_ADDRESS} label="Address" />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Token ID for {mintResult.nftName}</label>
                    <CopyButton text={String(mintResult.tokenId)} label="Token ID" />
                  </div>
                </div>
              </div>

              {/* Next button */}
              {eligibleNFTs.length > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  className="w-full gap-2"
                >
                  Mint Next NFT ({eligibleNFTs.length} remaining)
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMintResult(null);
                    checkOnChainStatus();
                  }}
                  className="w-full"
                >
                  Done
                </Button>
              )}
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                }}
              >
                Try again
              </Button>
            </motion.div>
          ) : currentNFT ? (
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Header with count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <span className="font-medium">Ready to Mint</span>
                </div>
                {remainingCount > 1 && (
                  <Badge variant="secondary" className="text-xs">
                    {currentIndex + 1} of {remainingCount}
                  </Badge>
                )}
              </div>

              {/* Current NFT preview */}
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex-shrink-0">
                  <img 
                    src={getNftArtwork(currentNFT.milestoneId)} 
                    alt={currentNFT.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{currentNFT.name}</h4>
                  <p className="text-xs text-muted-foreground capitalize">{currentNFT.category} Achievement</p>
                  <p className="text-xs text-muted-foreground mt-1">Token ID: {currentNFT.tokenId}</p>
                </div>
              </div>

              {/* Mint button */}
              <Button
                onClick={handleMint}
                disabled={isMinting}
                className="w-full gap-2"
                size="lg"
              >
                {isMinting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Minting...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Mint {currentNFT.name}
                  </>
                )}
              </Button>

              {/* Token reward info */}
              {isMinting && (
                <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                  <p className="text-xs text-center text-primary font-medium">
                    💰 This mint also earns you <span className="font-bold">$ZSOLAR</span> tokens!
                  </p>
                </div>
              )}

              {/* Skip to next */}
              {remainingCount > 1 && !isMinting && (
                <button
                  onClick={handleNext}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                >
                  Skip to next NFT →
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-2"
            >
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm font-medium">All NFTs Minted!</p>
              <p className="text-xs text-muted-foreground mt-1">
                All your earned NFTs are already on-chain 🎉
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}