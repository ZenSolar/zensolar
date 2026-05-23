/**
 * Pass C: route → human label registry for breadcrumbs.
 *
 * Returns ordered crumbs from the current pathname. Unknown segments are
 * title-cased (e.g. "/admin/foo-bar" → "Admin › Foo Bar").
 */

const STATIC_LABELS: Record<string, string> = {
  "": "Dashboard",
  "wallet": "Wallet",
  "mint-history": "Mint History",
  "energy-log": "Energy Logs",
  "nft-collection": "NFT Collection",
  "referrals": "Referrals",
  "store": "Store",
  "learn": "Learn",
  "profile": "Profile",
  "notifications": "Notifications",
  "settings": "Settings",
  "help": "Help",
  "white-paper": "White Paper",
  "technology": "Patent Technology",
  "proof-of-genesis": "Proof-of-Genesis",
  "engineering": "Engineering",
  "admin": "Admin",
  "founders": "Founders Vault",
  "founder-pack": "Founder Pack",
  "auth": "Sign In",
  "demo": "Demo",
  "demo-leonardo": "Investor Demo",
};

const titleCase = (s: string) =>
  s
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export interface Crumb {
  label: string;
  href: string;
}

export function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  // Always start with Dashboard
  const crumbs: Crumb[] = [{ label: "Dashboard", href: "/" }];
  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    const label = STATIC_LABELS[seg] ?? titleCase(seg);
    crumbs.push({ label, href: acc });
  }
  return crumbs;
}
