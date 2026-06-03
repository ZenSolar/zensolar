import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  RotateCcw,
  Save,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Trash2,
  Zap,
  Activity,
  Flame,
  Gauge,
  Coins,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VaultPinGate } from "@/components/founders/VaultPinGate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  buildDefaultConfig,
  simulate,
  type SimulatorConfig,
  type TierId,
  type StakingMixEntry,
} from "@/lib/founderSimulator";
import { STAKING_MULTIPLIERS, formatUSD, formatTokenAmount } from "@/lib/tokenomics";
import { downloadCsv, downloadFile, todayStamp } from "@/lib/csvExport";

const SCENARIOS_KEY = "zen.founder-simulator.scenarios";

interface SavedScenario {
  name: string;
  savedAt: string;
  config: SimulatorConfig;
}

export default function FoundersSimulator() {
  const { user, isLoading: authLoading } = useAuth();
  const [isFounder, setIsFounder] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setIsFounder(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (cancelled) return;
      const set = new Set((roles ?? []).map((r) => r.role));
      setIsFounder(set.has("founder") || set.has("admin"));
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading || isFounder === null) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth?redirect=/founders/simulator" replace />;
  if (!isFounder) return <Navigate to="/" replace />;

  return (
    <VaultPinGate userId={user.id}>
      <Helmet>
        <title>Founder Simulator · ZenSolar</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href="https://www.zensolar.com/simulator" />
      </Helmet>
      <SimulatorContent />
    </VaultPinGate>
  );
}

// ------- Content -------

function SimulatorContent() {
  const [config, setConfig] = useState<SimulatorConfig>(() => buildDefaultConfig());
  const [scenarioName, setScenarioName] = useState("Untitled scenario");
  const [scenarios, setScenarios] = useState<SavedScenario[]>(() => loadScenarios());
  const [splitUnlocked, setSplitUnlocked] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const result = useMemo(() => simulate(config), [config]);

  const update = (patch: Partial<SimulatorConfig>) =>
    setConfig((c) => ({ ...c, ...patch }));

  const updateTier = (id: TierId, patch: Partial<SimulatorConfig["tiers"][TierId]>) =>
    setConfig((c) => ({ ...c, tiers: { ...c.tiers, [id]: { ...c.tiers[id], ...patch } } }));

  const updateTranche = (idx: number, patch: Partial<SimulatorConfig["tranches"][number]>) =>
    setConfig((c) => {
      const next = c.tranches.slice();
      next[idx] = { ...next[idx], ...patch };
      return { ...c, tranches: next };
    });

  const updateStake = (idx: number, share: number) =>
    setConfig((c) => {
      const next = c.stakingMix.slice();
      next[idx] = { ...next[idx], share };
      return { ...c, stakingMix: next };
    });

  const reset = () => {
    setConfig(buildDefaultConfig());
    setSplitUnlocked(false);
    toast.success("Reset to v3.1 defaults");
  };

  const saveScenario = () => {
    const name = scenarioName.trim() || "Untitled scenario";
    const entry: SavedScenario = {
      name,
      savedAt: new Date().toISOString(),
      config,
    };
    const next = [entry, ...scenarios.filter((s) => s.name !== name)].slice(0, 30);
    setScenarios(next);
    localStorage.setItem(SCENARIOS_KEY, JSON.stringify(next));
    toast.success(`Saved "${name}"`);
  };

  const loadScenario = (name: string) => {
    const s = scenarios.find((x) => x.name === name);
    if (!s) return;
    setConfig(s.config);
    setScenarioName(s.name);
    toast.success(`Loaded "${s.name}"`);
  };

  const deleteScenario = (name: string) => {
    const next = scenarios.filter((s) => s.name !== name);
    setScenarios(next);
    localStorage.setItem(SCENARIOS_KEY, JSON.stringify(next));
  };

  const exportCSV = () => {
    const rows = result.months.map((m) => ({
      month: m.month,
      users: Math.round(m.users),
      raw_mint: Math.round(m.rawMint),
      to_user: Math.round(m.toUser),
      to_lp_direct: Math.round(m.toLPDirect),
      burned: Math.round(m.burned),
      to_treasury_tokens: Math.round(m.toTreasuryTokens),
      lp_usdc: Math.round(m.lpUSDC),
      lp_tokens: Math.round(m.lpTokens),
      price: m.price.toFixed(6),
      sell_tokens: Math.round(m.sellTokens),
      sell_usdc_out: Math.round(m.sellUSDCOut),
      tax_to_lp_usdc: Math.round(m.taxToLPUSDC),
      treasury_usdc: Math.round(m.treasuryUSDC),
      buyback_usdc: Math.round(m.buybackUSDC),
      circulating_supply: Math.round(m.circulatingSupply),
      tranche_injected_usdc: Math.round(m.trancheInjectedUSDC),
      secondary_injected_usdc: Math.round(m.secondaryInjectedUSDC),
      locked_supply: Math.round(m.lockedSupply),
      net_lp_change_usdc: Math.round(m.netLPChangeUSDC),
    }));
    downloadCsv(`zensolar-simulator-${todayStamp()}.csv`, rows);
  };

  const exportConfigJSON = () => {
    downloadFile(
      `zensolar-simulator-config-${todayStamp()}.json`,
      JSON.stringify({ scenarioName, config }, null, 2),
      "application/json",
    );
  };

  const exportPDF = () => {
    window.print();
  };

  const chartData = result.months.map((m) => ({
    month: `M${m.month}`,
    lpUSDC: Math.round(m.lpUSDC),
    price: Number(m.price.toFixed(4)),
    sellUSD: -Math.round(m.sellUSDCOut),
    inflowUSD: Math.round(m.trancheInjectedUSDC + m.taxToLPUSDC + m.buybackUSDC),
    netLP: Math.round(m.netLPChangeUSDC),
    supply: Math.round(m.circulatingSupply),
    treasury: Math.round(m.treasuryUSDC),
    cumBuyback: 0, // filled below
  }));
  let cum = 0;
  chartData.forEach((d, i) => {
    cum += result.months[i].buybackUSDC;
    d.cumBuyback = Math.round(cum);
  });

  const trancheMonths = config.tranches
    .filter((t) => t.enabled && t.triggerMonth >= 0)
    .map((t) => ({ id: t.id, month: `M${t.triggerMonth}` }));

  return (
    <div className="min-h-[100svh] bg-background text-foreground" ref={printRef}>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>

      {/* Header */}
      <header className="no-print sticky top-0 z-30 border-b border-border/50 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link
            to="/founders"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Founders Vault
          </Link>
          <div className="text-[11px] uppercase tracking-widest text-primary/80">
            Confidential · Joseph + Michael
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* Title */}
        <section className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3" />
            Founder Tool
          </div>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Tokenomics &amp; Launch Simulator
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
            Pressure-test the ZenSolar mainnet launch — multi-tranche LP funding, tiered mint ratios,
            monthly caps, staking, and treasury defense — before we commit a single dollar of the seed.
          </p>
        </section>

        {/* Intro */}
        <SimulatorIntro />

        {/* Scenario bar */}
        <Card className="no-print p-4 sm:p-5 bg-card/60 backdrop-blur border-border/60">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex-1 min-w-0">
              <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Scenario name
              </Label>
              <Input
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="mt-1 bg-background/60"
              />
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <Button onClick={saveScenario} variant="default" size="sm" className="gap-1.5">
                <Save className="h-4 w-4" /> Save
              </Button>
              <Select
                onValueChange={loadScenario}
                value=""
              >
                <SelectTrigger className="w-[180px] h-9 bg-background/60">
                  <SelectValue placeholder="Load scenario…" />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">No saved scenarios</div>
                  )}
                  {scenarios.map((s) => (
                    <div key={s.name} className="flex items-center justify-between pr-1">
                      <SelectItem value={s.name} className="flex-1">
                        {s.name}
                      </SelectItem>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteScenario(s.name);
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={reset} variant="outline" size="sm" className="gap-1.5">
                <RotateCcw className="h-4 w-4" /> Reset v3.1
              </Button>
              <Button onClick={exportCSV} variant="outline" size="sm" className="gap-1.5">
                <Download className="h-4 w-4" /> CSV
              </Button>
              <Button onClick={exportConfigJSON} variant="outline" size="sm" className="gap-1.5">
                <Download className="h-4 w-4" /> JSON
              </Button>
              <Button onClick={exportPDF} variant="outline" size="sm" className="gap-1.5">
                <FileText className="h-4 w-4" /> PDF
              </Button>
            </div>
          </div>
        </Card>

        {/* Headline KPIs */}
        <HeadlineKPIs config={config} result={result} />

        {/* Main grid */}
        <div className="grid lg:grid-cols-[420px_1fr] gap-6">
          {/* Inputs */}
          <div className="space-y-4 no-print">
            <Collapsible title="Launch Parameters" defaultOpen>
              <NumberField
                label="Launch price (USD)"
                value={config.launchPriceUSD}
                step={0.01}
                onChange={(v) => update({ launchPriceUSD: v })}
              />
              <NumberField
                label="Initial LP — USDC"
                value={config.initialLPUSDC}
                step={10_000}
                onChange={(v) => update({ initialLPUSDC: v })}
              />
              <NumberField
                label="Initial LP — $ZSOLAR tokens"
                value={config.initialLPTokens}
                step={100_000}
                onChange={(v) => update({ initialLPTokens: v })}
              />
              <NumberField
                label="Horizon (months)"
                value={config.horizonMonths}
                step={1}
                min={6}
                max={120}
                onChange={(v) => update({ horizonMonths: Math.max(6, Math.min(120, Math.round(v))) })}
              />
            </Collapsible>

            <Collapsible title="Multi-Tranche Liquidity Plan" defaultOpen badge="Critical">
              {config.tranches.map((tr, i) => (
                <div
                  key={tr.id}
                  className="rounded-lg border border-border/60 bg-background/40 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{tr.id}</div>
                    <Switch
                      checked={tr.enabled}
                      onCheckedChange={(v) => updateTranche(i, { enabled: v })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <NumberField
                      label="USDC"
                      value={tr.usdc}
                      step={50_000}
                      onChange={(v) => updateTranche(i, { usdc: v })}
                    />
                    <NumberField
                      label="Tokens"
                      value={tr.tokens}
                      step={500_000}
                      onChange={(v) => updateTranche(i, { tokens: v })}
                    />
                    <NumberField
                      label="Trigger month (-1 = off)"
                      value={tr.triggerMonth}
                      step={1}
                      min={-1}
                      onChange={(v) => updateTranche(i, { triggerMonth: Math.round(v) })}
                    />
                    <NumberField
                      label="LP < USDC (0 = off)"
                      value={tr.triggerLPBelowUSDC}
                      step={10_000}
                      onChange={(v) => updateTranche(i, { triggerLPBelowUSDC: v })}
                    />
                  </div>
                  <NumberField
                    label="Price < (0 = off)"
                    value={tr.triggerPriceBelow}
                    step={0.01}
                    onChange={(v) => updateTranche(i, { triggerPriceBelow: v })}
                  />
                </div>
              ))}
            </Collapsible>

            <Collapsible title="Tokenomics Levers (v3.1)">
              <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-[11px] text-amber-300 mb-2 flex items-center gap-2">
                <Lock className="h-3 w-3" />
                <span>Mint split is locked at 50/25/20/5. Unlock for what-if only.</span>
                <Switch
                  className="ml-auto"
                  checked={splitUnlocked}
                  onCheckedChange={setSplitUnlocked}
                />
              </div>
              <SliderField
                label={`User share (${config.splitUserPct}%)`}
                value={config.splitUserPct}
                min={0}
                max={100}
                disabled={!splitUnlocked}
                onChange={(v) => update({ splitUserPct: v })}
              />
              <SliderField
                label={`LP share (${config.splitLPPct}%)`}
                value={config.splitLPPct}
                min={0}
                max={100}
                disabled={!splitUnlocked}
                onChange={(v) => update({ splitLPPct: v })}
              />
              <SliderField
                label={`Burn share (${config.splitBurnPct}%)`}
                value={config.splitBurnPct}
                min={0}
                max={100}
                disabled={!splitUnlocked}
                onChange={(v) => update({ splitBurnPct: v })}
              />
              <SliderField
                label={`Treasury share (${config.splitTreasuryPct}%)`}
                value={config.splitTreasuryPct}
                min={0}
                max={100}
                disabled={!splitUnlocked}
                onChange={(v) => update({ splitTreasuryPct: v })}
              />
              <SliderField
                label={`Transfer tax → LP (${config.transferTaxPct}%)`}
                value={config.transferTaxPct}
                min={0}
                max={10}
                step={0.5}
                onChange={(v) => update({ transferTaxPct: v })}
              />
            </Collapsible>

            <Collapsible title="Tiered Mint Ratios & Caps" badge="Critical">
              {(["base", "regular", "power"] as TierId[]).map((tid) => {
                const t = config.tiers[tid];
                return (
                  <div
                    key={tid}
                    className="rounded-lg border border-border/60 bg-background/40 p-3 space-y-2"
                  >
                    <div className="font-medium text-sm capitalize">{tid}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <NumberField
                        label="kWh per token"
                        value={t.kwhPerToken}
                        step={0.1}
                        onChange={(v) => updateTier(tid, { kwhPerToken: v })}
                      />
                      <NumberField
                        label="Avg kWh/mo"
                        value={t.avgKwhPerMonth}
                        step={50}
                        onChange={(v) => updateTier(tid, { avgKwhPerMonth: v })}
                      />
                      <NumberField
                        label="Soft cap/mo (0=off)"
                        value={t.softMintCapPerMonth}
                        step={100}
                        onChange={(v) => updateTier(tid, { softMintCapPerMonth: v })}
                      />
                      <NumberField
                        label="Sell rate (0-1)"
                        value={t.sellRate}
                        step={0.05}
                        min={0}
                        max={1}
                        onChange={(v) => updateTier(tid, { sellRate: Math.max(0, Math.min(1, v)) })}
                      />
                    </div>
                    <SliderField
                      label={`Onboarding share (${Math.round(t.onboardingShare * 100)}%)`}
                      value={t.onboardingShare * 100}
                      min={0}
                      max={100}
                      onChange={(v) => updateTier(tid, { onboardingShare: v / 100 })}
                    />
                  </div>
                );
              })}
              <ShareSumWarning
                total={
                  config.tiers.base.onboardingShare +
                  config.tiers.regular.onboardingShare +
                  config.tiers.power.onboardingShare
                }
                label="onboarding shares"
              />
            </Collapsible>

            <Collapsible title="Staking, Vesting & Unlock" badge="Critical">
              {config.stakingMix.map((entry, i) => (
                <SliderField
                  key={entry.tier}
                  label={`${STAKING_MULTIPLIERS[entry.tier].label} (${STAKING_MULTIPLIERS[entry.tier].multiplier}×) — ${Math.round(entry.share * 100)}%`}
                  value={entry.share * 100}
                  min={0}
                  max={100}
                  onChange={(v) => updateStake(i, v / 100)}
                />
              ))}
              <ShareSumWarning
                total={config.stakingMix.reduce((s, e) => s + e.share, 0)}
                label="staking mix"
              />
              <NumberField
                label="Early-unlock burn %"
                value={config.earlyUnlockBurnPct}
                step={5}
                min={0}
                max={100}
                onChange={(v) => update({ earlyUnlockBurnPct: v })}
              />
            </Collapsible>

            <Collapsible title="Onboarding Path Architecture">
              <NumberField
                label="Initial users (month 0)"
                value={config.initialUsers}
                step={50}
                onChange={(v) => update({ initialUsers: v })}
              />
              <NumberField
                label="Monthly growth rate (decimal, e.g. 0.15)"
                value={config.monthlyGrowthRate}
                step={0.01}
                onChange={(v) => update({ monthlyGrowthRate: v })}
              />
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Growth curve</Label>
                <Select
                  value={config.growthCurve}
                  onValueChange={(v) =>
                    update({ growthCurve: v as SimulatorConfig["growthCurve"] })
                  }
                >
                  <SelectTrigger className="bg-background/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compound">Compound</SelectItem>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="s-curve">S-curve (logistic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <NumberField
                label="Scale ceiling (users)"
                value={config.scaleCeiling}
                step={10_000}
                onChange={(v) => update({ scaleCeiling: v })}
              />
            </Collapsible>

            <Collapsible title="Treasury Defense & Satoshi-Mirror">
              <NumberField
                label="Starting treasury (USDC)"
                value={config.treasuryStartUSDC}
                step={50_000}
                onChange={(v) => update({ treasuryStartUSDC: v })}
              />
              <NumberField
                label="Defense floor price (USD)"
                value={config.defenseFloorPrice}
                step={0.01}
                onChange={(v) => update({ defenseFloorPrice: v })}
              />
              <NumberField
                label="Monthly buyback cap (USDC)"
                value={config.monthlyBuybackCapUSDC}
                step={5_000}
                onChange={(v) => update({ monthlyBuybackCapUSDC: v })}
              />
              <SliderField
                label={`% of bought-back tokens burned (${config.buybackTokensBurnedPct}%)`}
                value={config.buybackTokensBurnedPct}
                min={0}
                max={100}
                onChange={(v) => update({ buybackTokensBurnedPct: v })}
              />
              <NumberField
                label="Self-sustaining window (months)"
                value={config.selfSustainingWindowMonths}
                step={1}
                min={1}
                max={24}
                onChange={(v) =>
                  update({ selfSustainingWindowMonths: Math.max(1, Math.round(v)) })
                }
              />
            </Collapsible>
          </div>

          {/* Charts */}
          <div className="space-y-4">
            <ChartCard title="LP Depth (USDC) over time">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeOpacity={0.08} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any) => formatUSD(Number(v))}
                  />
                  {trancheMonths.map((t) => (
                    <ReferenceLine
                      key={t.id}
                      x={t.month}
                      stroke="hsl(var(--primary))"
                      strokeOpacity={0.4}
                      strokeDasharray="3 3"
                      label={{ value: t.id, position: "top", fill: "hsl(var(--primary))", fontSize: 10 }}
                    />
                  ))}
                  <Line
                    type="monotone"
                    dataKey="lpUSDC"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Token price projection">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeOpacity={0.08} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `$${Number(v).toFixed(2)}`} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any) => `$${Number(v).toFixed(4)}`}
                  />
                  <ReferenceLine
                    y={config.defenseFloorPrice}
                    stroke="hsl(var(--destructive))"
                    strokeOpacity={0.5}
                    strokeDasharray="4 4"
                    label={{ value: "Defense floor", position: "right", fontSize: 10, fill: "hsl(var(--destructive))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Sell pressure vs LP injection">
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeOpacity={0.08} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any) => formatUSD(Number(v))}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="inflowUSD"
                    name="LP inflow (tranche + tax + buyback)"
                    fill="hsl(var(--primary) / 0.35)"
                    stroke="hsl(var(--primary))"
                  />
                  <Area
                    type="monotone"
                    dataKey="sellUSD"
                    name="Sell pressure (USDC out)"
                    fill="hsl(var(--destructive) / 0.35)"
                    stroke="hsl(var(--destructive))"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Net LP change per month">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeOpacity={0.08} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any) => formatUSD(Number(v))}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" />
                  <Bar dataKey="netLP" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Circulating supply growth (vs 1T cap)">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeOpacity={0.08} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any) => formatTokenAmount(Number(v))}
                  />
                  <Line
                    type="monotone"
                    dataKey="supply"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Treasury + cumulative buyback (USDC)">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeOpacity={0.08} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any) => formatUSD(Number(v))}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="treasury" name="Treasury" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cumBuyback" name="Cumulative buyback" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>

        <HowItWorks />
      </main>
    </div>
  );
}

// ------- Sub-components -------

function SimulatorIntro() {
  return (
    <Card className="p-6 sm:p-8 bg-gradient-to-br from-primary/[0.08] via-card/60 to-card/60 border-primary/20">
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-widest text-primary mb-3">
        For Joseph &amp; Michael
      </div>
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
        Why This Simulator Exists
      </h2>
      <div className="space-y-4 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl">
        <p>
          This tool was built specifically for you and Joseph to pressure-test the ZenSolar launch
          and tokenomics before we go live.
        </p>
        <p>The goal is to answer critical questions like:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>How much USDC and how many tokens should we launch with in Tranche 1?</li>
          <li>How should we structure Tranche 2 and Tranche 3 from the $5M seed round?</li>
          <li>
            What combination of monthly minting caps, tiered ratios, and staking/vesting schedules
            gives us the strongest flywheel while keeping sell pressure manageable?
          </li>
          <li>
            At what point does the liquidity pool become self-sustaining so we no longer need to
            inject more capital?
          </li>
        </ul>
        <p>
          You can change almost every major lever (launch amounts, tranche triggers, mint ratios
          per tier, monthly caps, staking lock durations and benefits, onboarding path choices,
          sell rates, halving timing, treasury defense rules, etc.) and instantly see the projected
          impact on LP health, token price trajectory, circulating supply, and when the system
          becomes self-funding.
        </p>
        <p>
          Use this simulator to align on the final launch parameters and capital allocation before
          we execute. All scenarios can be saved and exported.
        </p>
        <p className="text-foreground font-medium">
          This is a serious planning and decision-making tool — not a toy. Treat the outputs seriously.
        </p>
      </div>
    </Card>
  );
}

function HeadlineKPIs({
  config,
  result,
}: {
  config: SimulatorConfig;
  result: ReturnType<typeof simulate>;
}) {
  const last = result.months[result.months.length - 1];
  const items = [
    {
      label: "Final price",
      value: `$${last?.price.toFixed(4) ?? "—"}`,
      sub: `Launch $${config.launchPriceUSD.toFixed(2)}`,
      trend: last && last.price >= config.launchPriceUSD ? "up" : "down",
    },
    {
      label: "Final LP depth",
      value: formatUSD(last?.lpUSDC ?? 0),
      sub: `${formatTokenAmount(last?.lpTokens ?? 0)} tokens`,
    },
    {
      label: "Self-sustaining",
      value:
        result.selfSustainingMonth !== null
          ? `Month ${result.selfSustainingMonth}`
          : "Not reached",
      sub: `${config.selfSustainingWindowMonths}-mo window`,
      trend: result.selfSustainingMonth !== null ? "up" : "down",
    },
    {
      label: "Peak drawdown",
      value: `${(result.peakDrawdownPct * 100).toFixed(1)}%`,
      sub: "from peak price",
      trend: result.peakDrawdownPct < 0.25 ? "up" : "down",
    },
    {
      label: "Tranche USDC used",
      value: formatUSD(result.totalTrancheUSDC),
      sub: `${config.tranches.filter((t) => t.enabled).length} active`,
    },
    {
      label: "Total burned",
      value: formatTokenAmount(result.totalBurned),
      sub: "tokens",
    },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((it) => (
        <Card key={it.label} className="p-4 bg-card/60 backdrop-blur border-border/60">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {it.label}
          </div>
          <div className="mt-1 text-lg sm:text-xl font-semibold tracking-tight flex items-center gap-1.5">
            {it.value}
            {it.trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-primary" />}
            {it.trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{it.sub}</div>
        </Card>
      ))}
    </div>
  );
}

function HowItWorks() {
  return (
    <Card className="p-6 sm:p-8 bg-card/40 border-border/50">
      <h3 className="text-lg font-semibold tracking-tight mb-3">How the math works</h3>
      <div className="grid sm:grid-cols-2 gap-6 text-sm text-muted-foreground leading-relaxed">
        <div className="space-y-2">
          <div className="font-medium text-foreground">Monthly loop</div>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Project users via the growth curve (compound / linear / s-curve).</li>
            <li>
              Per tier: <code className="text-primary">mint = users × share × (kWh / kWhPerToken) ×
              stakingMult</code>. Apply soft cap (Base only). Enforce 1T hard cap.
            </li>
            <li>
              Split raw mint by <code className="text-primary">User / LP / Burn / Treasury</code>.
            </li>
            <li>
              Sell pressure = <code className="text-primary">toUser × Σ(tierShare × sellRate)</code>.
              Apply against LP via constant-product <code className="text-primary">k = lpUSDC × lpTokens</code>.
            </li>
            <li>Recycle transfer-tax % of USDC-out back into LP.</li>
            <li>
              If <code className="text-primary">price &lt; defenseFloor</code>, swap up to monthly
              buyback cap from treasury and burn the configured share.
            </li>
            <li>Fire any tranche whose trigger matches (month, LP-below, or price-below).</li>
            <li>
              Mark "self-sustaining" once LP grew for N consecutive months without any tranche firing.
            </li>
          </ol>
        </div>
        <div className="space-y-2">
          <div className="font-medium text-foreground">Defaults</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>v3.1 mint split (50/25/20/5) and 3% transfer tax — both locked by default.</li>
            <li>Mainnet LP seed: $300K USDC / 3M $ZSOLAR at $0.10.</li>
            <li>
              Tier mix: Base 50% / Regular 40% / Power 10%. Sell rates 0.90 / 0.25 / 0.05.
            </li>
            <li>
              Staking mix: 55% none / 20% 3-mo / 15% 6-mo / 8% 12-mo / 2% 24-mo.
            </li>
            <li>
              Tranches: T1 $300K (M0) · T2 $1.5M (M6) · T3 $3M (M12) — sums to $4.8M of the $5M seed.
            </li>
            <li>Treasury $500K starting; defense floor $0.08; monthly buyback cap $50K.</li>
          </ul>
        </div>
      </div>
      <div className="mt-4 text-[11px] text-muted-foreground">
        Simulator is client-side. Nothing is sent to the backend. All scenarios are saved to your
        browser only.
      </div>
    </Card>
  );
}

// ------- Primitives -------

function Collapsible({
  title,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden bg-card/60 backdrop-blur border-border/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {badge && (
            <span className="text-[10px] uppercase tracking-widest text-primary border border-primary/40 rounded-full px-1.5 py-0.5">
              {badge}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
    </Card>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        className="bg-background/60 h-9"
      />
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
}

function ShareSumWarning({ total, label }: { total: number; label: string }) {
  const off = Math.abs(total - 1) > 0.01;
  if (!off) return null;
  return (
    <div className="flex items-center gap-2 rounded-md border border-amber-400/30 bg-amber-400/5 px-2 py-1.5 text-[11px] text-amber-300">
      <AlertTriangle className="h-3 w-3" />
      {label} sum to {(total * 100).toFixed(0)}% (should be 100%)
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4 sm:p-5 bg-card/60 backdrop-blur border-border/60">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">
        {title}
      </div>
      {children}
    </Card>
  );
}

// ------- Utils -------

const tooltipStyle = {
  background: "hsl(var(--background))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

function fmtCompact(v: number) {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(Math.round(v));
}

function loadScenarios(): SavedScenario[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SCENARIOS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
