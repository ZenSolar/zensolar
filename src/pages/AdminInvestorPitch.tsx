import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PitchDeckShell } from "@/components/investor/pitch/PitchDeckShell";
import { Slide01Title } from "@/components/investor/pitch/slides/Slide01Title";
import { Slide02Catalyst } from "@/components/investor/pitch/slides/Slide02Catalyst";
import { Slide03Supercycle } from "@/components/investor/pitch/slides/Slide03Supercycle";
import { Slide04Opportunity } from "@/components/investor/pitch/slides/Slide04Opportunity";
import { Slide05Solution } from "@/components/investor/pitch/slides/Slide05Solution";
import { Slide06Technology } from "@/components/investor/pitch/slides/Slide06Technology";
import { Slide07ValueMechanism } from "@/components/investor/pitch/slides/Slide07ValueMechanism";
import { Slide08POLDefense } from "@/components/investor/pitch/slides/Slide08POLDefense";
import { Slide09Revenue } from "@/components/investor/pitch/slides/Slide09Revenue";
import { Slide10UnitEconomics } from "@/components/investor/pitch/slides/Slide10UnitEconomics";
import { Slide11Traction } from "@/components/investor/pitch/slides/Slide11Traction";
import { Slide12RiskMitigation } from "@/components/investor/pitch/slides/Slide12RiskMitigation";
import { Slide13TheAsk } from "@/components/investor/pitch/slides/Slide13TheAsk";

const slides = [
  <Slide01Title />,
  <Slide02Catalyst />,
  <Slide03Supercycle />,
  <Slide04Opportunity />,
  <Slide05Solution />,
  <Slide06Technology />,
  <Slide07ValueMechanism />,
  <Slide08POLDefense />,
  <Slide09Revenue />,
  <Slide10UnitEconomics />,
  <Slide11Traction />,
  <Slide12RiskMitigation />,
  <Slide13TheAsk />,
];

const slideLabels = [
  'Title',
  'The Catalyst',
  'Tokenization Supercycle',
  'The Opportunity',
  'The Solution',
  'Proprietary Tech & IP',
  'Value Mechanism',
  'POL Defense',
  'Revenue Model',
  'Unit Economics',
  'Traction & Beta',
  'Risk Mitigation',
  'The Ask',
];

export default function AdminInvestorPitch() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking: adminLoading } = useAdminCheck();

  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[hsl(220,20%,6%)]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(207,90%,54%)]" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return <PitchDeckShell slides={slides} slideLabels={slideLabels} />;
}
