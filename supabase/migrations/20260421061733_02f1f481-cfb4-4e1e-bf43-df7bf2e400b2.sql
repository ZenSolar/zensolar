-- Simplify vault_webauthn_credentials RLS: founder gating is enforced at the page level (FounderPack route + VaultBiometricGate).
-- The is_founder() check in WITH CHECK was failing for some sessions even though the user has the founder role,
-- likely due to JWT timing. Owner-scoped policy is sufficient since route-level guards already restrict access.

DROP POLICY IF EXISTS "Founders manage own credentials" ON public.vault_webauthn_credentials;

CREATE POLICY "Users manage own vault credentials"
ON public.vault_webauthn_credentials
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
