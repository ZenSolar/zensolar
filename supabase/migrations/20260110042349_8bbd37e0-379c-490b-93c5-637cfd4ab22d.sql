-- Add unique constraint on endpoint column for push_subscriptions
-- This allows upsert operations to work correctly
ALTER TABLE public.push_subscriptions 
ADD CONSTRAINT push_subscriptions_endpoint_unique UNIQUE (endpoint);