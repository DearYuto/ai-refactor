import { create } from "zustand";

type UiState = {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: false,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}));

type MarketOrderState = {
  selectedOrderPrice: number | null;
  setSelectedOrderPrice: (price: number | null) => void;
};

export const useMarketOrderStore = create<MarketOrderState>((set) => ({
  selectedOrderPrice: null,
  setSelectedOrderPrice: (price) => set({ selectedOrderPrice: price }),
}));
