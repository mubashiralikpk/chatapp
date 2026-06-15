'use client';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { initPresenceListener } from '@/lib/presence';

export function useAuth() {
  const { user, loading, setUser, setFirebaseUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, firebaseUser => {
      setFirebaseUser(firebaseUser);
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Subscribe to user profile
      const unsubUser = onSnapshot(
        doc(db, 'users', firebaseUser.uid),
        snap => {
          if (snap.exists()) {
            setUser({ uid: snap.id, ...snap.data() } as any);
          }
          setLoading(false);
        }
      );

      // Init presence
      initPresenceListener(firebaseUser.uid);

      return () => unsubUser();
    });

    return () => unsubAuth();
  }, []);

  return { user, loading };
}
