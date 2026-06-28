---
name: Tesla New Product Auto-Detection
description: Detect newly-added Tesla products (Wall Connector, Powerwall, Vehicle, Solar) on next sync and surface a "New device detected" notification with deep-link to onboarding
type: feature
scope: remix-v2
---

# Tesla New Product Auto-Detection (Remix v2)

## Why
Delight moment: user installs a Tesla Wall Connector / Powerwall / new vehicle → next time they open ZenSolar, app says "🎉 New Tesla Wall Connector detected — connect it to start earning $ZSOLAR." Today we silently ignore additions.

## Mechanism
- Tesla Fleet API `/api/1/products` returns a full account-scoped list every sync (account-scoped, NOT address-scoped → works even if user hasn't updated home address in Tesla app).
- Diff live `products[]` vs stored snapshot on every sync.

## Schema
```sql
CREATE TABLE public.tesla_known_products (
  id uuid PK,
  user_id uuid NOT NULL,
  product_id text NOT NULL,           -- vehicle_id / energy_site_id / wall_connector din
  product_type text NOT NULL,         -- 'vehicle' | 'powerwall' | 'solar' | 'wall_connector'
  display_name text,
  vin_or_din text,
  first_seen_at timestamptz DEFAULT now(),
  acknowledged_at timestamptz,
  site_assignment uuid REFERENCES user_home_locations(id),
  UNIQUE(user_id, product_id)
);
```
+ standard GRANTs (authenticated CRUD, service_role ALL) + RLS scoped to auth.uid().

## Flow
1. `tesla-sync` edge fn fetches `/products`, upserts into `tesla_known_products`.
2. Rows where `first_seen_at > last_login` AND `acknowledged_at IS NULL` → push into `notifications` + `pending_push_messages`.
3. Client banner/toast on next session: "New {product_type} detected" + CTA → `/onboarding/connect-{type}?product_id=…`.
4. CTA flow asks "Which home is this at?" → writes `site_assignment` (doubles as multi-site onboarding trigger).
5. On ack → set `acknowledged_at`.

## Edge cases
- First-ever sync: bulk-insert all products with `acknowledged_at = now()` (don't spam user with notifications for pre-existing fleet).
- Removed products: mark `removed_at` (don't delete — keeps PoG receipt history).
- Multi-site: site_assignment links into multi-site support (Remix v2 roadmap dependency).

## Dependencies (Remix v2)
- Multi-site / multi-home support (Joseph has 2 houses now)
- Onboarding v2 (4-screen tour)
- Notification center (already specced)

## Est: ~½ day
1 migration · 1 diff routine in tesla-sync · 1 NewDeviceBanner component · 1 deep-link handler.
