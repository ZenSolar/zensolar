import {
  fadeOutShimmerGraph,
  stopShimmerGraph,
  type ShimmerNodes,
} from './shimmerAudioGraph';

export function clearShimmerDisposalTimeout(timeoutId: number | null) {
  if (timeoutId !== null) {
    window.clearTimeout(timeoutId);
  }
  return null;
}

export function scheduleShimmerGraphDisposal(
  nodes: ShimmerNodes,
  onDispose: () => void,
  releaseMs = 1500,
) {
  fadeOutShimmerGraph(nodes, nodes.ctx.currentTime);

  return window.setTimeout(() => {
    stopShimmerGraph(nodes);
    onDispose();
  }, releaseMs);
}

export function pollUntilShimmerReady(startAttempt: () => boolean, intervalMs = 120) {
  let disposed = false;
  let pollId: number | null = null;

  const tryStart = () => {
    if (disposed) return;
    if (startAttempt()) return;
    pollId = window.setTimeout(tryStart, intervalMs);
  };

  tryStart();

  return () => {
    disposed = true;
    if (pollId !== null) {
      window.clearTimeout(pollId);
    }
  };
}