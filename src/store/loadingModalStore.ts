import { create } from 'zustand';

interface LoadingModalState {
  visible: boolean;
  message?: string;
  show: (message?: string) => void;
  hide: () => void;
}

export const useLoadingModalStore = create<LoadingModalState>((set) => ({
  visible: false,
  message: undefined,
  show: (message) => set({ visible: true, message }),
  hide: () => set({ visible: false, message: undefined }),
}));
