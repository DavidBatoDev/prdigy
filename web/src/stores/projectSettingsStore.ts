import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProjectSettingsState {
  isSidebarExpanded: boolean;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
}

export const useProjectSettingsStore = create<ProjectSettingsState>()(
  persist(
    (set) => ({
      isSidebarExpanded: true,
      toggleSidebar: () =>
        set((state) => ({ isSidebarExpanded: !state.isSidebarExpanded })),
      setSidebarExpanded: (expanded) => set({ isSidebarExpanded: expanded }),
    }),
    {
      name: 'prdigy-project-settings-storage',
    }
  )
);
