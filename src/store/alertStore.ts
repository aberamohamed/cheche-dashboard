import { create } from 'zustand';

export type AlertVariant = 'error' | 'success' | 'warning' | 'info';

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AlertButton {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void;
}

interface AlertPayload {
  title: string;
  message?: string;
  variant?: AlertVariant;
  buttons: AlertButton[];
}

interface AlertState extends AlertPayload {
  visible: boolean;
  show: (payload: AlertPayload) => void;
  hide: () => void;
}

const DEFAULT_BUTTONS: AlertButton[] = [{ text: 'OK' }];

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: '',
  message: undefined,
  variant: 'info',
  buttons: DEFAULT_BUTTONS,
  show: (payload) =>
    set({
      visible: true,
      title: payload.title,
      message: payload.message,
      variant: payload.variant ?? 'info',
      buttons: payload.buttons.length ? payload.buttons : DEFAULT_BUTTONS,
    }),
  hide: () => set({ visible: false }),
}));
