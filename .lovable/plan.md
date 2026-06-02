## Root cause (identified — no guessing needed)

`src/hooks/useSafeWagmi.ts` defines `useSafeHook<T>(hookFn, fallback)` which **conditionally** calls a wagmi hook based on `useWeb3Ready()`:

```ts
function useSafeHook<T>(hookFn, fallback) {
  const ready = useWeb3Ready();
  if (!ready) return fallback;
  return hookFn();   // ← extra hook(s) appear only after web3 is ready
}
```

`useWeb3Ready()` reads `Web3ReadyContext`, which `LazyWeb3Provider` flips from `false` → `true` after the Web3 chunk lazy-loads (~1.5s after first paint, or on `requestIdleCallback`). Every component that uses `useSafeAccount`, `useSafeWalletClient`, or `useSafeWatchAsset` therefore **gains hooks mid-lifetime** → React throws "Rendered more hooks than during the previous render". On the reverse transition (or React replaying the bad render), the sibling message "Rendered fewer hooks than expected" fires. This perfectly matches both screenshots.

The same anti-pattern is hard-coded in `src/hooks/useWalletType.ts` lines 31-35 (conditional `useSwitchChain()` inside `if (web3Ready)`).

Why this surfaces *now* on the two reported flows:
- **After `/auth` login** — RootRoute swaps from `<Navigate>` to `<AppLayout><Index/></AppLayout>`. Many descendants (`TokenPriceCard`, wallet UI, AppKit modal, `RewardActions`) consume `useSafeAccount` / `useWalletType`. They mount while `web3Ready=false`, then the context flips → boom.
- **Admin → View as Tschida** — `useDashboardData` re-keys on `viewAsUserId`, triggering re-renders across the same descendants while the Web3 chunk is still settling.

This is unrelated to the `enphase-data` edge-function edit; the Enphase "Idle" tile is a downstream symptom of the dashboard never finishing render.

## Fix

Two surgical edits, no behavior change beyond eliminating the violation.

### 1. `src/components/providers/LazyWeb3Provider.tsx`

Wrap the children with a `<div style={{display:'contents'}} key="…">` whose `key` differs between the pre-Web3 and Web3-ready branches. Changing the `key` forces React to unmount the pre-Web3 subtree and mount a fresh one once wagmi is available, so every descendant sees a **stable** hook count for its entire lifetime.

```tsx
if (!shouldLoad || !LoadedProvider) {
  return <div key="web3-pending" style={{display:'contents'}}>{children}</div>;
}
return (
  <LoadedProvider>
    <Web3ReadyGate>
      <div key="web3-ready" style={{display:'contents'}}>{children}</div>
    </Web3ReadyGate>
  </LoadedProvider>
);
```

`display:'contents'` keeps layout identical (the wrapper div has no box). The remount is a one-time event per session, ~1.5s after first paint — invisible to users and far cheaper than the current crash.

### 2. `src/hooks/useWalletType.ts`

Remove the inline conditional `useSwitchChain()` call and route it through the safe-wagmi pattern. After fix #1, `useSafeHook` is safe because `web3Ready` no longer flips within a single mount.

Add to `useSafeWagmi.ts`:

```ts
import { useSwitchChain } from 'wagmi';
export function useSafeSwitchChain() {
  return useSafeHook(
    () => useSwitchChain(),
    { switchChainAsync: undefined } as any as ReturnType<typeof useSwitchChain>,
  );
}
```

Then in `useWalletType.ts` replace lines 30-35 with:

```ts
const { switchChainAsync } = useSafeSwitchChain();
```

(unconditional, no eslint-disable, no `let`).

## Verification

1. Restart preview, hard reload the sandbox.
2. Sign in via `/auth` with a test account — confirm `/` lands on the dashboard with no error overlay; check console for zero React warnings about hook order.
3. Open admin, View-as Tschida — confirm his dashboard renders.
4. On Tschida's Live Energy cockpit, confirm the Enphase tile reads non-zero wattage (the new `enphase-data` 5-min `production_micro` path is already deployed; once the dashboard renders, it will repopulate within ≤60s cache TTL).
5. If the Enphase tile is still 0 in daylight after the crash is gone, that's a separate diagnosis (edge-function logs for `enphase-data` filtered to Tschida's `user_id`) and will be handled in a follow-up — out of scope for this fix.

## Out of scope

- No tokenomics, mint, schema, or RLS changes.
- No edge-function changes (the `enphase-data` edit from earlier stays).
- No UI/copy changes.
- No theme work.

## Risk

Very low. The remount happens once per session, with no visible layout shift (`display:contents`). The `useWalletType` change uses the same safe-wagmi pattern already used by `useSafeAccount` throughout the codebase.

## Deliverable

- Crash-free login flow and crash-free admin view-as.
- Confirmation of Tschida's Enphase tile state (live wattage or, if still 0, the precise log evidence pointing at the next fix).
