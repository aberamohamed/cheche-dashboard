import { LOADING_MODAL_TRANSITION_MS } from '@/components/ui/LoadingModal';
import { useLoadingModalStore } from '@/store/loadingModalStore';

export function waitForModalTransition(ms = LOADING_MODAL_TRANSITION_MS): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withLoading<T>(
  task: () => Promise<T>,
  message = 'Please wait...'
): Promise<T> {
  const { show, hide } = useLoadingModalStore.getState();
  show(message);
  try {
    return await task();
  } finally {
    hide();
  }
}

export async function withLoadingForAtLeast<T>(
  task: () => Promise<T> | T,
  message = 'Please wait...',
  minimumMs = 2000
): Promise<T> {
  const { show, hide } = useLoadingModalStore.getState();
  show(message);
  try {
    await new Promise((resolve) => setTimeout(resolve, minimumMs));
    return await task();
  } finally {
    hide();
  }
}

/** Show loading on the current screen, then hide and navigate without overlay on the next screen. */
export async function withSellCheckoutTransition(options: {
  prepare?: () => Promise<void> | void;
  navigate: () => void;
  message?: string;
  minimumMs?: number;
  onModalHide?: () => void;
}): Promise<void> {
  const { show, hide } = useLoadingModalStore.getState();
  const message = options.message ?? 'Please wait...';
  const minimumMs = options.minimumMs ?? 0;
  const prepare = options.prepare ?? (() => undefined);

  show(message);
  const startedAt = Date.now();
  try {
    await prepare();
    const remaining = minimumMs - (Date.now() - startedAt);
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
  } finally {
    hide();
    options.onModalHide?.();
    await waitForModalTransition();
    options.navigate();
  }
}

export async function withLoadingAfterDismiss<T>(
  task: () => Promise<T>,
  message = 'Please wait...'
): Promise<T> {
  await waitForModalTransition();
  return withLoading(task, message);
}
