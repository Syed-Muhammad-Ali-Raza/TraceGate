import { create } from 'zustand';

type UiState = {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));
