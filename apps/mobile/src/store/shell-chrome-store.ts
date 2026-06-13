import { create } from 'zustand';

interface ShellChromeStore {
  isBottomTabCompact: boolean;
  setBottomTabCompact: (isCompact: boolean) => void;
}

export const useShellChromeStore = create<ShellChromeStore>((set) => ({
  isBottomTabCompact: false,
  setBottomTabCompact(isBottomTabCompact) {
    set((state) => (state.isBottomTabCompact === isBottomTabCompact ? state : { isBottomTabCompact }));
  },
}));
