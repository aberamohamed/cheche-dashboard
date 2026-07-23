import { create } from 'zustand';

interface ToastState {
  visible: boolean;
  message: string;
  show: (message: string) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: '',
  show: (message) => set({ visible: true, message }),
  hide: () => set({ visible: false, message: '' }),
}));
