import { flushSync } from 'react-dom';

type ScopedTransitionTarget = HTMLElement & {
  startViewTransition?: (updateCallback: () => void | Promise<void>) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

/**
 * Progressively enhances isolated UI subtree swaps (category filters, card tabs)
 * with Element-scoped View Transitions while keeping fixed HUD overlays interactive.
 */
export function runScopedViewTransition(
  scopeEl: HTMLElement | null,
  updateState: () => void
): void {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const target = scopeEl as ScopedTransitionTarget | null;
  if (
    !target ||
    prefersReduced ||
    typeof Element === 'undefined' ||
    !('startViewTransition' in Element.prototype) ||
    typeof target.startViewTransition !== 'function'
  ) {
    updateState();
    return;
  }

  try {
    const transition = target.startViewTransition(() => {
      flushSync(updateState);
    });
    transition?.ready?.catch(() => {});
  } catch {
    updateState();
  }
}

