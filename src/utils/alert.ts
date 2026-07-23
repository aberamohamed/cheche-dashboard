import type { AlertButton, AlertVariant } from '@/store/alertStore';
import { useAlertStore } from '@/store/alertStore';

function inferVariant(title: string): AlertVariant {
  const t = title.toLowerCase();
  if (
    t.includes('fail') ||
    t.includes('error') ||
    t.includes('invalid') ||
    t.includes('insufficient') ||
    t.includes('required') ||
    t.includes('missing')
  ) {
    return 'error';
  }
  if (
    t.includes('success') ||
    t.includes('downloaded') ||
    t.includes('submitted') ||
    t.includes('applied')
  ) {
    return 'success';
  }
  if (t.includes('logout') || t.includes('clear') || t.includes('sure')) {
    return 'warning';
  }
  return 'info';
}

export function appAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: { variant?: AlertVariant }
): void {
  useAlertStore.getState().show({
    title,
    message,
    variant: options?.variant ?? inferVariant(title),
    buttons: buttons ?? [{ text: 'OK' }],
  });
}
