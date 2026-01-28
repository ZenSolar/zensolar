-- Add is_beta_mint column to track mints made during Live Beta mode
ALTER TABLE public.mint_transactions
ADD COLUMN is_beta_mint boolean NOT NULL DEFAULT false;