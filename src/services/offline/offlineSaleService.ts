import { insertPendingSale } from '@/services/offline/pendingSalesDb';
import { usePendingSalesStore } from '@/store/pendingSalesStore';
import type { EnqueuePendingSaleInput } from '@/types/offline';

/** Persist a sale to the local outbox and refresh the reactive badge count. */
export async function enqueueOfflineSale(input: EnqueuePendingSaleInput): Promise<void> {
  await insertPendingSale(input);
  await usePendingSalesStore.getState().refreshCount();
}

/** Heuristic: was a failed request caused by lack of connectivity rather than a real API rejection? */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true; // fetch throws TypeError on network failure
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes('network request failed') ||
    message.includes('network error') ||
    message.includes('failed to fetch') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('unable to resolve host') ||
    message.includes('connection')
  );
}
