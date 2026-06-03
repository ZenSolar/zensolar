# Restyle /home to match /investor (visual polish only)

Goal: bring the calm, editorial, premium feel of `/investor` + `/investor/pitch` onto `/home`, without changing the consumer-first content, section order, or CTAs. No new modules. No merging.

## Visual language to lift from /investor

Captured from `InvestorPitch.tsx` and `Investor.tsx`:

- Tight content rails: `max-w-3xl` for narrative, `max-w-5xl` for module-heavy sections (today /home mostly uses `max-w-4xl`).
- Eyebrow labels: `text-xs uppercase tracking-[0.22em] text-muted-foreground` instead of colored shadcn `Badge` pills.
- Headings: `font-semibold tracking-tight leading-[1.05]`, sizes `text-3xl md:text-5xl` for hero, `text-2xl md:text-3xl` for section headers.
- Section chrome: thin `border-t border-border/40` dividers between sections, instead of the current chevron/diamond/angle `SectionDivider` decorations.
- Cards: `rounded-2xl border border-border/60 bg-card/40` (plus `rounded-3xl border border-secondary/30 bg-secondary/5` for emphasis blocks). Replaces today's heavy `shadow-2xl shadow-primary/10` cards.
- Accent: lean on `secondary` (zen green) for emphasis; drop the rainbow of solar/secondary/primary/energy borders used in `CleanEnergyCenterShowcase`.
- Hero background: single radial gradient `bg-[radial-gradient(ellipse_at_top,hsl(var(--secondary)/0.18),transparent_60%)]` instead of layered gradients.
- Footer/contact line uses `text-[11px] text-muted-foreground` with secondary-tinted email link.

## Changes by file

```text
src/pages/Home.tsx
├── Remove all <SectionDivider> instances (chevron/diamond/angle).
├── Wrap the main column to inherit the editorial rhythm (no new sections).
└── Keep all <LazySection> + Suspense boundaries intact.

src/components/home/HomeHero.tsx
├── Swap layered gradient bg for the single radial-at-top secondary glow.
├── Eyebrow chip → uppercase tracking label.
├── Headline → font-semibold tracking-tight leading-[1.05], same copy.
└── Stats row (if present) → 3-up card grid styled like InvestorPitch hero KPI tiles.

src/components/home/DashboardShowcase.tsx
├── Replace shadow-heavy Card wrapper with rounded-2xl border-border/60 bg-card/40.
├── Convert "Unified Dashboard" Badge → uppercase eyebrow.
└── Tighten container to max-w-3xl for copy, keep max-w-5xl around the InvestorEnergyFlowCard.

src/components/home/CleanEnergyCenterShowcase.tsx
├── Drop multicolor border-l-{solar,secondary,primary,energy} accents → uniform border-border/60.
├── Eyebrow + heading restyle to match.
└── Wallet preview + KPI rows keep their data, lose the heavy shadow and rainbow chips.

src/components/home/{HowItWorksSection,NFTMilestoneSection,StoreRedemptionSection,
  WhyZenSolarSection,TokenizationWaveSection,PricingSection,
  SubscriptionTransparencyPanel,TestimonialsSection,FAQSection,HomeCTA,HomeFooter}.tsx
└── Apply the same 4 rules consistently:
     1. Eyebrow chip → uppercase tracking label.
     2. Container → max-w-3xl (or max-w-5xl for grids).
     3. Card surfaces → rounded-2xl border-border/60 bg-card/40.
     4. Heading weight/tracking aligned, no decorative dividers.
```

## Out of scope (per your answers)

- No content rewrites, no new sections, no investor modules dropped into /home.
- No IA changes, no archived pages.
- `HomeNav`, `FloatingSectionNav`, `LiveStatsBar`, route, SEO untouched.
- No light-mode work (dark-mode only stays).
- `/investor` and `/investor/pitch` not touched.

## Acceptance

- Visiting `/home` feels like the same brand world as `/investor/pitch`: calm, editorial, secondary-accent, thin dividers, tight rails.
- Every existing section still renders with the same content, CTAs, links, and lazy-loading.
- Mobile (390×844) hierarchy reads cleanly — headings, eyebrows, and cards scale without overflow.
- No semantic-token violations: zero new hard-coded hex colors; everything routes through `bg-card`, `border-border`, `text-muted-foreground`, `secondary`, etc.

## Technical notes

- All edits stay in `src/pages/Home.tsx` + `src/components/home/*`.
- No changes to `tailwind.config.ts` or `index.css` tokens — the investor look already uses tokens that exist.
- `SectionDivider` import can be removed from `Home.tsx`; component itself stays in place for any other consumers.
- No new dependencies, no route changes, no Supabase work.
