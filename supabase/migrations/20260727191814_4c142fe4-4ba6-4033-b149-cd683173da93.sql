CREATE TABLE IF NOT EXISTS public.tesla_oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL,
  redirect_uri text NOT NULL,
  return_to text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  consumed_at timestamptz
);

GRANT ALL ON public.tesla_oauth_states TO service_role;

ALTER TABLE public.tesla_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_tesla_oauth_states_user_created
ON public.tesla_oauth_states (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tesla_oauth_states_expires
ON public.tesla_oauth_states (expires_at);