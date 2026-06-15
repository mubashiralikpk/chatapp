import { create } from 'zustand';

type Panel = 'chats' | 'rooms' | 'contacts' | 'notifications' | 'profile';

interface UIStore {
  activePanel:    Panel;
  sidebarOpen:    boolean;
  setActivePanel: (p: Panel) => void;
  toggleSidebar:  () => void;
}

export const useUIStore = create<UIStore>(set => ({
  activePanel:    'chats',
  sidebarOpen:    true,
  setActivePanel: activePanel => set({ activePanel }),
  toggleSidebar:  ()          => set(s => ({ sidebarOpen: !s.sidebarOpen })),
}));
