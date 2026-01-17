import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, Eye, AlertTriangle, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface NFTPreview {
  userId: string;
  displayName: string | null;
  walletAddress: string | null;
  onChainNFTs: { id: number; name: string }[];
  databaseNFTs: { id: number; name: string }[];
  mintTransactionCount: number;
}

interface ResetResult {
  onChainBurns: { tokenId: number; name: string; txHash: string }[];
  onChainErrors: { tokenId: number; name: string; error: string }[];
  dbTransactionsDeleted: number;
}

export function NFTResetPanel() {
  const [walletAddress, setWalletAddress] = useState('');
  const [preview, setPreview] = useState<NFTPreview | null>(null);
  const [result, setResult] = useState<ResetResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'previewing' | 'resetting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handlePreview = async () => {
    const trimmedAddress = walletAddress.trim();
    if (!trimmedAddress) {
      toast.error('Please enter a wallet address');
      return;
    }

    // Basic wallet address validation
    if (!trimmedAddress.startsWith('0x') || trimmedAddress.length !== 42) {
      toast.error('Invalid wallet address format');
      return;
    }

    setStatus('previewing');
    setMessage('Fetching user NFT data...');
    setPreview(null);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('reset-user-nfts', {
        body: { action: 'preview', walletAddress: trimmedAddress },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success) throw new Error(response.data?.error || 'Preview failed');

      setPreview(response.data.preview);
      setStatus('idle');
      setMessage('');
    } catch (error) {
      console.error('Preview error:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to preview');
      toast.error('Failed to preview user NFTs');
    }
  };

  const handleReset = async () => {
    if (!preview) {
      toast.error('Please preview first');
      return;
    }

    setStatus('resetting');
    setMessage('Resetting NFT data...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('reset-user-nfts', {
        body: { 
          action: 'reset', 
          targetUserId: preview.userId,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success) throw new Error(response.data?.error || 'Reset failed');

      setResult(response.data.results);
      setStatus('success');
      setMessage(response.data.message);
      toast.success('NFT reset completed!');
    } catch (error) {
      console.error('Reset error:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Reset failed');
      toast.error('Failed to reset NFTs');
    }
  };

  const clearAll = () => {
    setWalletAddress('');
    setPreview(null);
    setResult(null);
    setStatus('idle');
    setMessage('');
  };

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-destructive" />
          <CardTitle className="text-lg">Reset User NFTs</CardTitle>
        </div>
        <CardDescription>
          Clear a user's mint history to allow them to re-earn and re-mint all NFTs from scratch.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Address Input */}
        <div className="space-y-2">
          <Label htmlFor="nft-reset-wallet">Target Wallet Address</Label>
          <div className="flex gap-2">
            <Input
              id="nft-reset-wallet"
              placeholder="0x..."
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="font-mono text-sm"
            />
            <Button 
              variant="outline" 
              onClick={handlePreview}
              disabled={status === 'previewing' || status === 'resetting' || !walletAddress.trim()}
            >
              {status === 'previewing' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the user's connected wallet address (e.g., 0x1234...abcd)
          </p>
        </div>

        {/* Preview Results */}
        {preview && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">{preview.displayName || 'Unknown User'}</span>
              <Badge variant="outline" className="font-mono text-xs">
                {preview.walletAddress ? `${preview.walletAddress.slice(0, 6)}...${preview.walletAddress.slice(-4)}` : 'No wallet'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">On-Chain NFTs:</span>
                <span className="ml-2 font-medium">{preview.onChainNFTs.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">DB Records:</span>
                <span className="ml-2 font-medium">{preview.mintTransactionCount}</span>
              </div>
            </div>

            {preview.databaseNFTs.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">NFTs to clear:</span>
                <div className="flex flex-wrap gap-1">
                  {preview.databaseNFTs.map(nft => (
                    <Badge key={nft.id} variant="secondary" className="text-xs">
                      {nft.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Note: Activity data is never affected */}
            <p className="text-xs text-muted-foreground pt-2 border-t">
              ⚡ Activity data (solar, EV, battery metrics) will NOT be affected
            </p>

            {/* Reset Button */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="destructive"
                onClick={handleReset}
                disabled={status === 'resetting'}
                className="flex-1"
              >
                {status === 'resetting' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Reset All NFT Data
              </Button>
              <Button variant="outline" onClick={clearAll}>
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-md ${
            status === 'success' ? 'bg-green-500/10 text-green-600' :
            status === 'error' ? 'bg-destructive/10 text-destructive' :
            'bg-muted text-muted-foreground'
          }`}>
            {status === 'success' && <CheckCircle2 className="h-4 w-4" />}
            {status === 'error' && <XCircle className="h-4 w-4" />}
            {(status === 'previewing' || status === 'resetting') && <Loader2 className="h-4 w-4 animate-spin" />}
            <span className="text-sm">{message}</span>
          </div>
        )}

        {/* Reset Results */}
        {result && (
          <div className="space-y-2 p-3 bg-green-500/10 rounded-md">
            <div className="text-sm space-y-1">
              <p>✓ Deleted <strong>{result.dbTransactionsDeleted}</strong> mint transaction records</p>
              <p className="text-muted-foreground">✓ Activity data preserved</p>
            </div>
            {result.onChainErrors.length > 0 && (
              <div className="flex items-start gap-2 mt-2 p-2 bg-amber-500/10 rounded">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                <p className="text-xs text-amber-600">
                  On-chain NFTs remain (can't be burned remotely). User can still re-earn and re-mint - old NFTs won't block new ones.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Warning */}
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-md">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
          <p className="text-xs text-amber-600">
            <strong>Caution:</strong> This clears the user's mint history, allowing them to re-mint all NFTs. 
            Use for testing or if a user needs to restart their journey.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
