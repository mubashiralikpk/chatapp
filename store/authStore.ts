import { create } from 'zustand';
import { User } from '@/types';

interface AuthStore {
  user:        User | null;
  firebaseUser: any | null;
  loading:     boolean;
  setUser:     (user: User | null) => void;
  setFirebaseUser: (u: any) => void;
  setLoading:  (v: boolean) => void;
}

export const useAuthStore = create<AuthStore>(set => ({
  user:            null,
  firebaseUser:    null,
  loading:         true,
  setUser:         user         => set({ user }),
  setFirebaseUser: firebaseUser => set({ firebaseUser }),
  setLoading:      loading      => set({ loading }),
}));
