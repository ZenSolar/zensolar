import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email({ message: "Enter a valid email address" })
  .max(255, { message: "Email must be less than 255 characters" });

export function ChangeEmailCard() {
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const sync = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setSignedIn(!!data.user);
      setCurrentEmail(data.user?.email ?? null);
      setPendingEmail((data.user as { new_email?: string } | null)?.new_email ?? null);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
      if (session) void sync();
    });

    void sync();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async () => {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (parsed.data.toLowerCase() === (currentEmail ?? "").toLowerCase()) {
      toast.message("That's already your login email.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      toast.error("You're signed out in this browser. Sign in, then try again.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser(
      { email: parsed.data },
      { emailRedirectTo: window.location.origin }
    );
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    setPendingEmail(parsed.data);
    setEmail("");
    toast.success(`Confirmation sent to ${parsed.data}. Click the link to finish the change.`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-primary" />
          Login email
        </CardTitle>
        <CardDescription>
          {currentEmail ? `Currently signed in as ${currentEmail}` : "Update the email you sign in with"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingEmail && (
          <p className="text-xs text-muted-foreground">
            Pending change to <span className="text-foreground font-medium">{pendingEmail}</span> — confirm via the link
            we emailed.
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="new-login-email" className="text-xs">
            New email address
          </Label>
          <Input
            id="new-login-email"
            type="email"
            autoComplete="email"
            placeholder="you@zensolar.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button onClick={submit} disabled={saving || !email} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Send confirmation link
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Your login email only changes after you click the link sent to the new address.
        </p>
      </CardContent>
    </Card>
  );
}
