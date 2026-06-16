/**
 * Production Route Config — Zen Solar (Customer Build)
 *
 * SSOT for the clean remix. Paste into the new project and wire into App.tsx.
 * If a route isn't in this file, it doesn't ship to paying customers.
 *
 * Conventions:
 * - All authenticated app routes live under /app (single AppLayout shell).
 * - Public routes are top-level.
 * - Lazy-load everything except the landing + auth screens for fast first paint.
 * - Mobile-first; bottom nav surfaces the 5 `inBottomNav` routes in order.
 */

import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import {
  Home,
  Zap,
  Wallet as WalletIcon,
  Cpu,
  MoreHorizontal,
} from "lucide-react";

// --- Eager (critical path) ---------------------------------------------------
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";

// --- Lazy (everything else) --------------------------------------------------
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));

const Dashboard = lazy(() => import("@/pages/app/Dashboard"));
const MintHistory = lazy(() => import("@/pages/app/MintHistory"));
const Devices = lazy(() => import("@/pages/app/Devices"));
const Wallet = lazy(() => import("@/pages/app/Wallet"));
const ProofOfGenesis = lazy(() => import("@/pages/app/ProofOfGenesis"));
const Referrals = lazy(() => import("@/pages/app/Referrals"));
const Notifications = lazy(() => import("@/pages/app/Notifications"));
const Profile = lazy(() => import("@/pages/app/Profile"));
const Settings = lazy(() => import("@/pages/app/Settings"));
const HelpCenter = lazy(() => import("@/pages/app/HelpCenter"));

const Subscribe = lazy(() => import("@/pages/Subscribe"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// --- Types -------------------------------------------------------------------
export type RouteAuth = "public" | "authed";

export interface AppRoute {
  /** URL path (react-router v6 syntax) */
  path: string;
  /** Page component */
  component:
    | ComponentType<unknown>
    | LazyExoticComponent<ComponentType<unknown>>;
  /** Auth requirement */
  auth: RouteAuth;
  /** Wrap in AppLayout (header/bottom nav). Defaults to true for /app/*. */
  layout?: "app" | "bare";
  /** SEO title (rendered into <title>) */
  title: string;
  /** SEO meta description (<160 chars) */
  description: string;
  /** Show in bottom nav (mobile). */
  inBottomNav?: {
    label: string;
    icon: ComponentType<{ className?: string }>;
    order: number;
  };
  /** Show in "More" overflow menu. */
  inMoreMenu?: { label: string; order: number };
  /** Include in /sitemap.xml */
  sitemap?: boolean;
}

// --- Routes ------------------------------------------------------------------
export const routes: AppRoute[] = [
  // ---------- Public ----------
  {
    path: "/",
    component: Index,
    auth: "public",
    layout: "bare",
    title: "Zen Solar — Creating Currency From Energy",
    description:
      "Tap-to-Mint™ $ZSOLAR from your own solar, battery, and EV. Connect Tesla, Enphase, SolarEdge, or Wallbox in 60 seconds.",
    sitemap: true,
  },
  {
    path: "/auth",
    component: Auth,
    auth: "public",
    layout: "bare",
    title: "Sign in — Zen Solar",
    description: "Sign in or create your Zen Solar account.",
  },
  {
    path: "/terms",
    component: Terms,
    auth: "public",
    layout: "bare",
    title: "Terms of Service — Zen Solar",
    description: "The terms that govern your use of Zen Solar.",
    sitemap: true,
  },
  {
    path: "/privacy",
    component: Privacy,
    auth: "public",
    layout: "bare",
    title: "Privacy Policy — Zen Solar",
    description: "How Zen Solar collects, uses, and protects your data.",
    sitemap: true,
  },

  // ---------- Onboarding ----------
  {
    path: "/onboarding",
    component: Onboarding,
    auth: "authed",
    layout: "bare",
    title: "Connect your system — Zen Solar",
    description:
      "Connect Tesla, Enphase, SolarEdge, or Wallbox to start minting $ZSOLAR from your own energy.",
  },

  // ---------- App (authenticated) ----------
  {
    path: "/app",
    component: Dashboard,
    auth: "authed",
    layout: "app",
    title: "Clean Energy Center — Zen Solar",
    description: "Your live energy flow, today's mint, and $ZSOLAR balance.",
    inBottomNav: { label: "Home", icon: Home, order: 1 },
  },
  {
    path: "/app/mint",
    component: MintHistory,
    auth: "authed",
    layout: "app",
    title: "Mint History — Zen Solar",
    description: "Every Tap-to-Mint™ receipt, anchored on-chain.",
    inBottomNav: { label: "Mint", icon: Zap, order: 2 },
  },
  {
    path: "/app/wallet",
    component: Wallet,
    auth: "authed",
    layout: "app",
    title: "Wallet — Zen Solar",
    description: "Your $ZSOLAR balance, send, receive, and on-chain activity.",
    inBottomNav: { label: "Wallet", icon: WalletIcon, order: 3 },
  },
  {
    path: "/app/devices",
    component: Devices,
    auth: "authed",
    layout: "app",
    title: "Devices — Zen Solar",
    description: "Connected systems and their live health.",
    inBottomNav: { label: "Devices", icon: Cpu, order: 4 },
  },
  {
    path: "/app/proof-of-genesis/:mintId",
    component: ProofOfGenesis,
    auth: "authed",
    layout: "app",
    title: "Proof of Genesis — Zen Solar",
    description: "The cryptographic receipt for a single Tap-to-Mint™ event.",
  },
  {
    path: "/app/referrals",
    component: Referrals,
    auth: "authed",
    layout: "app",
    title: "Referrals — Zen Solar",
    description: "Invite friends. Earn $ZSOLAR when they connect a system.",
    inMoreMenu: { label: "Referrals", order: 1 },
  },
  {
    path: "/app/notifications",
    component: Notifications,
    auth: "authed",
    layout: "app",
    title: "Notifications — Zen Solar",
    description: "Inbox and notification preferences.",
    inMoreMenu: { label: "Notifications", order: 2 },
  },
  {
    path: "/app/profile",
    component: Profile,
    auth: "authed",
    layout: "app",
    title: "Profile — Zen Solar",
    description: "Account, wallet address, and payout settings.",
    inMoreMenu: { label: "Profile", order: 3 },
  },
  {
    path: "/app/settings",
    component: Settings,
    auth: "authed",
    layout: "app",
    title: "Settings — Zen Solar",
    description: "Units, language, push, security, and danger zone.",
    inMoreMenu: { label: "Settings", order: 4 },
  },
  {
    path: "/app/help",
    component: HelpCenter,
    auth: "authed",
    layout: "app",
    title: "Help Center — Zen Solar",
    description: "FAQ, contact support, and send feedback.",
    inMoreMenu: { label: "Help", order: 5 },
  },

  // ---------- Subscribe ----------
  {
    path: "/subscribe",
    component: Subscribe,
    auth: "authed",
    layout: "app",
    title: "Upgrade — Zen Solar",
    description: "Unlock pro features and higher mint throughput.",
  },

  // ---------- Catch-all ----------
  {
    path: "*",
    component: NotFound,
    auth: "public",
    layout: "bare",
    title: "Not found — Zen Solar",
    description: "This page doesn't exist.",
  },
];

// --- Derived helpers ---------------------------------------------------------
export const bottomNavRoutes = routes
  .filter((r) => r.inBottomNav)
  .sort((a, b) => a.inBottomNav!.order - b.inBottomNav!.order);

export const moreMenuRoutes = routes
  .filter((r) => r.inMoreMenu)
  .sort((a, b) => a.inMoreMenu!.order - b.inMoreMenu!.order);

export const sitemapRoutes = routes.filter((r) => r.sitemap);

/**
 * Hard whitelist — used by a runtime guard in App.tsx to 404 any path
 * not in this file. Belt-and-suspenders against accidental leftovers.
 */
export const PRODUCTION_PATHS = new Set(routes.map((r) => r.path));
