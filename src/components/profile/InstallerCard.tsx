import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, Phone, Mail, Building2, User as UserIcon, CheckCircle2, Sun } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { InstallerSearch } from "./InstallerSearch";
import type { KnownInstaller } from "@/data/solarInstallers";

/**
 * InstallerCard — Profile section for the customer's local PV installer.
 *
 * Why it lives in Profile:
 *  - The deterministic data-source signal (`solar_installer` = tesla | other)
 *    is set during onboarding. If the user picked the wrong one, this card is
 *    where they correct it without restarting onboarding.
 *  - The installer's contact info (name, company, phone, email) gives the
 *    customer a one-tap line to whoever actually wired their system —
 *    valuable for warranty / service calls and a soft retention signal for us.
 */
export function InstallerCard() {
  const { profile, updateProfile } = useProfile();

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [installer, setInstaller] = useState<"tesla" | "other" | "">("");
  const [inverterBrand, setInverterBrand] = useState<"enphase" | "solaredge" | "other" | "">("");
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (profile && !initialized) {
      setName(profile.installer_name ?? "");
      setCompany(profile.installer_company ?? "");
      setPhone(profile.installer_phone ?? "");
      setEmail(profile.installer_email ?? "");
      setInstaller((profile.solar_installer ?? "") as "tesla" | "other" | "");
      const ib = profile.solar_inverter_brand;
      setInverterBrand((ib === "enphase" || ib === "solaredge" || ib === "other") ? ib : "");
      setInitialized(true);
    }
  }, [profile, initialized]);

  const dirty =
    initialized &&
    (name !== (profile?.installer_name ?? "") ||
      company !== (profile?.installer_company ?? "") ||
      phone !== (profile?.installer_phone ?? "") ||
      email !== (profile?.installer_email ?? "") ||
      installer !== ((profile?.solar_installer ?? "") as string));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      installer_name: name.trim() || null,
      installer_company: company.trim() || null,
      installer_phone: phone.trim() || null,
      installer_email: email.trim() || null,
      solar_installer: installer || null,
    } as any);
    setSaving(false);
    if (!error) toast.success("Installer details saved");
  };

  const handleQuickPick = (choice: "tesla" | "other") => {
    setInstaller(choice);
  };

  const handleInstallerPick = (inst: KnownInstaller) => {
    // Pre-populate every field we have a hint for. User can still edit.
    setName(inst.name);
    if (inst.company) setCompany(inst.company);
    if (inst.phone) setPhone(inst.phone);
    if (inst.email) setEmail(inst.email);
    // Auto-route source-of-truth when picking Tesla Energy itself.
    if (inst.name === "Tesla Energy") setInstaller("tesla");
    else if (installer === "") setInstaller("other");
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-500/5 to-transparent border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Wrench className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Solar Installer</CardTitle>
              <CardDescription>
                Who installed your PV system? Determines which app we read solar
                production from.
              </CardDescription>
            </div>
            {profile?.solar_installer && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <CheckCircle2 className="h-2.5 w-2.5" />
                {profile.solar_installer === "tesla" ? "Tesla" : "Other"}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-4">
          {/* Source-of-truth picker */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sun className="h-3 w-3" />
              Solar production source
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickPick("tesla")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  installer === "tesla"
                    ? "border-primary bg-primary/10 shadow-[0_0_18px_hsl(var(--primary)/0.18)]"
                    : "border-border/50 bg-muted/20 hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-semibold">Tesla installed it</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Pull solar via Tesla API
                </p>
              </button>
              <button
                type="button"
                onClick={() => handleQuickPick("other")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  installer === "other"
                    ? "border-primary bg-primary/10 shadow-[0_0_18px_hsl(var(--primary)/0.18)]"
                    : "border-border/50 bg-muted/20 hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-semibold">Local installer</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Pull via Enphase / SolarEdge
                </p>
              </button>
            </div>
          </div>

          {/* Type-ahead search — pre-fills the contact fields below */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Quick-fill from common installers
            </Label>
            <InstallerSearch value={name} onPick={handleInstallerPick} onTextChange={setName} />
            <p className="text-[10px] text-muted-foreground/80">
              Pick yours to auto-fill name, company &amp; phone — or just type it in below.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <div className="space-y-1.5">
              <Label htmlFor="installer-name" className="text-xs flex items-center gap-1.5">
                <UserIcon className="h-3 w-3 text-muted-foreground" />
                Contact name
              </Label>
              <Input
                id="installer-name"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 100))}
                placeholder="e.g. Jane Smith"
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="installer-company" className="text-xs flex items-center gap-1.5">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                Company
              </Label>
              <Input
                id="installer-company"
                value={company}
                onChange={(e) => setCompany(e.target.value.slice(0, 100))}
                placeholder="e.g. SunRun Local"
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="installer-phone" className="text-xs flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-muted-foreground" />
                Phone
              </Label>
              <Input
                id="installer-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.slice(0, 32))}
                placeholder="(555) 123-4567"
                maxLength={32}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="installer-email" className="text-xs flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-muted-foreground" />
                Email
              </Label>
              <Input
                id="installer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.slice(0, 255))}
                placeholder="contact@installer.com"
                maxLength={255}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-muted-foreground">
              Used for warranty &amp; service — never shared.
            </p>
            <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
