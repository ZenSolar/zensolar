
CREATE TABLE public.founder_pins (
  user_id uuid PRIMARY KEY,
  pin_hash text NOT NULL,
  salt text NOT NULL,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.founder_pins ENABLE ROW LEVEL SECURITY;

-- Users can check whether their own PIN exists (no hash exposure needed for "is set" check via edge fn, but allow self-read of metadata)
CREATE POLICY "Users can view own pin row"
  ON public.founder_pins
  FOR SELECT
  USING (auth.uid() = user_id);

-- All writes go through edge functions using the service role; no direct client writes.

CREATE TRIGGER update_founder_pins_updated_at
  BEFORE UPDATE ON public.founder_pins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
