
-- 1. Remove public SELECT policy on yc_application_content
DROP POLICY IF EXISTS "Public can view yc content" ON public.yc_application_content;

-- 2. Remove is_admin column from profiles (roles managed via user_roles table)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;

-- 3. Remove dangerous user_rewards INSERT and UPDATE policies
DROP POLICY IF EXISTS "Users can insert their own rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Users can update their own rewards" ON public.user_rewards;

-- 4. Replace permissive beta_signups INSERT policy
DROP POLICY IF EXISTS "Anyone can submit beta signup" ON public.beta_signups;
CREATE POLICY "Anyone can submit beta signup"
  ON public.beta_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 5. Tighten referrals INSERT policy to validate referrer exists
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;
CREATE POLICY "Users can create their own referral"
  ON public.referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = referred_id
    AND EXISTS (
      SELECT 1 FROM public.profiles WHERE user_id = referrer_id AND referral_code IS NOT NULL
    )
  );

-- 6. Allow referred users to also see their referral record
CREATE POLICY "Referred users can view their referral"
  ON public.referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referred_id);
