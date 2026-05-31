import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PitchDeckShell } from "@/components/investor/pitch/PitchDeckShell";
import { Slide01Title } from "@/components/investor/pitch/slides/Slide01Title";
import { Slide02Catalyst } from "@/components/investor/pitch/slides/Slide02Catalyst";
import { Slide04Opportunity } from "@/components/investor/pitch/slides/Slide04Opportunity";
import { Slide05Solution } from "@/components/investor/pitch/slides/Slide05Solution";
import { Slide06Technology } from "@/components/investor/pitch/slides/Slide06Technology";
import { Slide07ThirdPrimitive } from "@/components/investor/pitch/slides/Slide07ThirdPrimitive";
import { Slide07ValueMechanism } from "@/components/investor/pitch/slides/Slide07ValueMechanism";
import { Slide08POLDefense } from "@/components/investor/pitch/slides/Slide08POLDefense";
import { Slide10ThreeWallsMoat } from "@/components/investor/pitch/slides/Slide10ThreeWallsMoat";
import { Slide09Revenue } from "@/components/investor/pitch/slides/Slide09Revenue";
import { Slide10UnitEconomics } from "@/components/investor/pitch/slides/Slide10UnitEconomics";
import { Slide11Traction } from "@/components/investor/pitch/slides/Slide11Traction";
import { Slide12RiskMitigation } from "@/components/investor/pitch/slides/Slide12RiskMitigation";
import { Slide13TheAsk } from "@/components/investor/pitch/slides/Slide13TheAsk";
import { SlideCompetition } from "@/components/investor/pitch/slides/SlideCompetition";

const slides = [
  <Slide01Title />,
  <Slide02Catalyst />,
  <Slide04Opportunity />,
  <Slide11Traction />,
  <Slide05Solution />,
  <Slide06Technology />,
  <Slide07ThirdPrimitive />,
  <Slide07ValueMechanism />,
  <Slide08POLDefense />,
  <Slide10ThreeWallsMoat />,
  <Slide09Revenue />,
  <Slide10UnitEconomics />,
  <SlideCompetition />,
  <Slide12RiskMitigation />,
  <Slide13TheAsk />,
];

const slideLabels = [
  'Title',
  'The Catalyst',
  'The Opportunity',
  'Traction & Beta',
  'The Solution',
  'Proprietary Tech & IP',
  'Third Consensus Primitive',
  'Value Mechanism',
  'Sell-Pressure Defense',
  'The Moat',
  'Revenue Model',
  'Unit Economics',
  'Competition',
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
