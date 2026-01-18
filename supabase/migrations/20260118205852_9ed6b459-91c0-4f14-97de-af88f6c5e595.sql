-- Drop the old check constraint and add wallbox to the allowed providers
ALTER TABLE public.energy_tokens DROP CONSTRAINT energy_tokens_provider_check;

ALTER TABLE public.energy_tokens ADD CONSTRAINT energy_tokens_provider_check 
CHECK (provider = ANY (ARRAY['tesla'::text, 'enphase'::text, 'solaredge'::text, 'wallbox'::text]));