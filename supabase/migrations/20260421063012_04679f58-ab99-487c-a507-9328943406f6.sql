-- Allow owners to delete their own webauthn credentials (for reset/re-enroll)
DROP POLICY IF EXISTS "Owners can delete their webauthn credentials" ON public.vault_webauthn_credentials;
CREATE POLICY "Owners can delete their webauthn credentials"
ON public.vault_webauthn_credentials
FOR DELETE
USING (auth.uid() = user_id);