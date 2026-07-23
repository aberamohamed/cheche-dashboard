import { create } from 'zustand';
import type { ReceiptData } from '@/types/receipt';

interface ReceiptState {
  receipt: ReceiptData | null;
  thermalPreviewReceipt: ReceiptData | null;
  setReceipt: (receipt: ReceiptData) => void;
  setThermalPreviewReceipt: (receipt: ReceiptData | null) => void;
  clearReceipt: () => void;
  clearThermalPreviewReceipt: () => void;
}

export const useReceiptStore = create<ReceiptState>((set) => ({
  receipt: null,
  thermalPreviewReceipt: null,
  setReceipt: (receipt) => set({ receipt }),
  setThermalPreviewReceipt: (receipt) => set({ thermalPreviewReceipt: receipt }),
  clearReceipt: () => set({ receipt: null }),
  clearThermalPreviewReceipt: () => set({ thermalPreviewReceipt: null }),
}));
