-- Create table for on-chain minting transactions
CREATE TABLE public.mint_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tx_hash TEXT NOT NULL,
  block_number TEXT,
  action TEXT NOT NULL, -- 'register', 'mint-rewards', 'mint-combos', 'claim-milestone-nfts'
  wallet_address TEXT NOT NULL,
  tokens_minted NUMERIC DEFAULT 0,
  nfts_minted INTEGER[] DEFAULT '{}',
  nft_names TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'confirmed', -- 'pending', 'confirmed', 'failed'
  gas_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_mint_transactions_user_id ON public.mint_transactions(user_id);
CREATE INDEX idx_mint_transactions_tx_hash ON public.mint_transactions(tx_hash);
CREATE INDEX idx_mint_transactions_created_at ON public.mint_transactions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.mint_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their own mint transactions" 
ON public.mint_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Service role can insert (from edge functions)
CREATE POLICY "Service can insert mint transactions" 
ON public.mint_transactions 
FOR INSERT 
WITH CHECK (true);

-- Admins can view all transactions
CREATE POLICY "Admins can view all mint transactions" 
ON public.mint_transactions 
FOR SELECT 
USING (is_admin(auth.uid()));