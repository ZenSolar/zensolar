import { useAppHistoryTracker } from "@/hooks/useAppHistory";

/** Mount-once component that records in-app navigation for the back button. */
export function AppHistoryTracker() {
  useAppHistoryTracker();
  return null;
}
