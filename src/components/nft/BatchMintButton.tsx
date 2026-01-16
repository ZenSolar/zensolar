import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Wallet,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

// NFT Contract address on Base Sepolia
const NFT_CONTRACT_ADDRESS = '0xD1d509a48CEbB8f9f9aAA462979D7977c30424E3';
import { supabase } from '@/integrations/supabase/client';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfetti } from '@/hooks/useConfetti';
import { MILESTONE_TO_TOKEN_ID } from '@/lib/nftTokenMapping';
import type { NFTMilestone } from '@/lib/nftMilestones';

// MetaMask Import Helper Component
function MetaMaskImportHelper({ 
  contractAddress, 
  tokenIds, 
  nftNames 
}: { 
  contractAddress: string; 
  tokenIds: number[]; 
  nftNames: string[];
}) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState<number | null>(null);

  const copyToClipboard = async (text: string, type: 'address' | 'tokenId', tokenId?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'address') {
        setCopiedAddress(true);
        toast.success('Contract address copied!');
        setTimeout(() => setCopiedAddress(false), 2000);
      } else if (tokenId !== undefined) {
        setCopiedTokenId(tokenId);
        toast.success(`Token ID ${tokenId} copied!`);
        setTimeout(() => setCopiedTokenId(null), 2000);
      }
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border/50 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Wallet className="h-4 w-4 text-primary" />
        <span>Add to MetaMask</span>
      </div>
      
      {/* Contract Address */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Contract Address</label>
        <button
          onClick={() => copyToClipboard(contractAddress, 'address')}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-background rounded-md border border-border text-xs font-mono hover:bg-muted transition-colors"
        >
          <span className="truncate">{contractAddress}</span>
          {copiedAddress ? (
            <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          )}
        </button>
      </div>

      {/* Token IDs */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">
          Token ID{tokenIds.length > 1 ? 's' : ''} (tap to copy)
        </label>
        <div className="flex flex-wrap gap-2">
          {tokenIds.map((tokenId, idx) => (
            <button
              key={tokenId}
              onClick={() => copyToClipboard(String(tokenId), 'tokenId', tokenId)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-mono transition-all ${
                copiedTokenId === tokenId
                  ? 'bg-green-500/10 border-green-500/30 text-green-600'
                  : 'bg-background border-border hover:bg-muted'
              }`}
              title={nftNames[idx] || `Token ${tokenId}`}
            >
              <span>{tokenId}</span>
              {copiedTokenId === tokenId ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          ))}
        </div>
        {tokenIds.length > 1 && (
          <p className="text-[10px] text-muted-foreground mt-1">
            ⚠️ MetaMask requires adding each NFT separately
          </p>
        )}
      </div>
    </div>
  );
}

interface BatchMintButtonProps {
  earnedMilestones: NFTMilestone[];
  onMintComplete?: () => void;
}

interface EligibleNFT {
  tokenId: number;
  name: string;
  category: string;
}

interface MintResult {
  success: boolean;
  txHash?: string;
  nftsMinted: number[];
  nftNames: string[];
  message: string;
}

export function BatchMintButton({ earnedMilestones, onMintComplete }: BatchMintButtonProps) {
  const { address, isConnected } = useAccount();
  const { triggerCelebration, triggerGoldBurst } = useConfetti();
  
  const [isChecking, setIsChecking] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [eligibleNFTs, setEligibleNFTs] = useState<EligibleNFT[]>([]);
  const [ownedTokenIds, setOwnedTokenIds] = useState<number[]>([]);
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
          category
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

      // If contract call fails (wallet not registered), treat as no owned NFTs
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
    setEligibleNFTs(getEligibleForMint());
  }, [ownedTokenIds, earnedMilestones]);

  const handleBatchMint = async () => {
    if (!address || eligibleNFTs.length === 0) return;
    
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

      // Separate milestone NFTs from combo NFTs
      const milestoneTokenIds = eligibleNFTs
        .filter(nft => nft.category !== 'combo' && nft.category !== 'welcome')
        .map(nft => nft.tokenId);
      
      const comboTokenIds = eligibleNFTs
        .filter(nft => nft.category === 'combo')
        .map(nft => nft.tokenId);
      
      const hasWelcome = eligibleNFTs.some(nft => nft.category === 'welcome');

      let allMintedNFTs: number[] = [];
      let allMintedNames: string[] = [];
      let lastTxHash: string | undefined;

      // 1. Check if user has Welcome NFT (required for other minting)
      // Note: We do NOT auto-mint the Welcome NFT - user must explicitly claim it
      const { data: statusData } = await supabase.functions.invoke('mint-onchain', {
        body: {
          action: 'status',
          walletAddress: address
        }
      });

      const hasWelcomeNFT = statusData?.hasWelcomeNFT;
      console.log('Status check result:', statusData, 'Has Welcome NFT:', hasWelcomeNFT);
      
      // If user is trying to mint the Welcome NFT specifically
      if (hasWelcome && !hasWelcomeNFT) {
        console.log('Minting Welcome NFT...');
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
        if (data.nftsMinted) {
          allMintedNFTs.push(...data.nftsMinted);
          allMintedNames.push(...(data.nftNames || []));
          lastTxHash = data.txHash;
        }
      } else if (!hasWelcomeNFT && (milestoneTokenIds.length > 0 || comboTokenIds.length > 0)) {
        // User needs Welcome NFT but doesn't have it and isn't minting it
        throw new Error('You need to claim your Welcome NFT first before minting other NFTs.');
      }

      // 2. Claim milestone NFTs if any
      if (milestoneTokenIds.length > 0) {
        const { data, error: fnError } = await supabase.functions.invoke('mint-onchain', {
          body: {
            action: 'claim-milestone-nfts',
            walletAddress: address
          }
        });

        if (fnError) throw fnError;
        if (data.nftsMinted && data.nftsMinted.length > 0) {
          allMintedNFTs.push(...data.nftsMinted);
          allMintedNames.push(...(data.nftNames || []));
          lastTxHash = data.txHash;
        }
      }

      // 3. Mint combo NFTs if any
      if (comboTokenIds.length > 0) {
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
        
        const comboTypes = comboTokenIds.map(id => comboTypeMap[id] || "combo");

        const { data, error: fnError } = await supabase.functions.invoke('mint-onchain', {
          body: {
            action: 'mint-combos',
            walletAddress: address,
            tokenIds: comboTokenIds,
            comboTypes
          }
        });

        if (fnError) throw fnError;
        if (data.nftsMinted) {
          allMintedNFTs.push(...data.nftsMinted);
          allMintedNames.push(...(data.nftNames || []));
          lastTxHash = data.txHash;
        }
      }

      setMintResult({
        success: allMintedNFTs.length > 0,
        txHash: lastTxHash,
        nftsMinted: allMintedNFTs,
        nftNames: allMintedNames,
        message: allMintedNFTs.length > 0 
          ? `Successfully minted ${allMintedNFTs.length} NFT(s)!`
          : 'No new NFTs were minted. They may already be on-chain.'
      });

      if (allMintedNFTs.length > 0) {
        // Trigger celebration
        triggerGoldBurst();
        setTimeout(() => triggerCelebration(), 200);
        
        // Refresh on-chain status
        await checkOnChainStatus();
        onMintComplete?.();
      }

    } catch (err: any) {
      console.error('Batch mint error:', err);
      setError(err.message || 'Failed to mint NFTs. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  // Calculate eligible count
  const eligibleCount = eligibleNFTs.length;
  const hasEligible = eligibleCount > 0;

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
      hasEligible 
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
              className="flex items-center justify-center gap-2 py-2"
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
              className="space-y-3"
            >
              <div className={`flex items-center gap-2 ${mintResult.success ? 'text-green-500' : 'text-muted-foreground'}`}>
                {mintResult.success ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="font-medium">{mintResult.message}</span>
              </div>
              
              {mintResult.nftNames.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {mintResult.nftNames.map((name, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>
              )}
              
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

              {/* MetaMask Import Helper */}
              {mintResult.success && mintResult.nftsMinted.length > 0 && (
                <MetaMaskImportHelper 
                  contractAddress={NFT_CONTRACT_ADDRESS}
                  tokenIds={mintResult.nftsMinted}
                  nftNames={mintResult.nftNames}
                />
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMintResult(null);
                  checkOnChainStatus();
                }}
              >
                Check for more
              </Button>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
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
                  checkOnChainStatus();
                }}
              >
                Try again
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {hasEligible ? 'NFTs Ready to Mint' : 'All NFTs Minted'}
                  </span>
                </div>
                {hasEligible && (
                  <Badge variant="default" className="gap-1">
                    <Zap className="h-3 w-3" />
                    {eligibleCount} eligible
                  </Badge>
                )}
              </div>

              {hasEligible && (
                <>
                  <div className="flex flex-wrap gap-1">
                    {eligibleNFTs.slice(0, 5).map((nft, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {nft.name}
                      </Badge>
                    ))}
                    {eligibleNFTs.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{eligibleNFTs.length - 5} more
                      </Badge>
                    )}
                  </div>

                  <Button
                    onClick={handleBatchMint}
                    disabled={isMinting}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {isMinting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Minting {eligibleCount} NFT(s)...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Mint All {eligibleCount} NFT(s)
                      </>
                    )}
                  </Button>

                  {isMinting && (
                    <div className="space-y-2">
                      <Progress value={33} className="h-1.5" />
                      <p className="text-xs text-center text-muted-foreground">
                        Processing transactions on Base Sepolia...
                      </p>
                      <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                        <p className="text-xs text-center text-primary font-medium">
                          💰 Each NFT mint also earns you <span className="font-bold">$ZSOLAR</span> tokens!
                        </p>
                        <p className="text-[10px] text-center text-muted-foreground mt-1">
                          Tokens are automatically sent to your wallet
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!hasEligible && (
                <p className="text-sm text-muted-foreground text-center">
                  All your earned NFTs are already on-chain! 🎉
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
