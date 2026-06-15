import {
  doc, updateDoc, serverTimestamp, onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserStatus } from '@/types';

export async function setUserPresence(uid: string, status: UserStatus) {
  await updateDoc(doc(db, 'users', uid), {
    status,
    lastSeen: serverTimestamp(),
  });
}

export function subscribeToUserPresence(
  uid: string,
  cb: (status: UserStatus, lastSeen: any) => void
) {
  return onSnapshot(doc(db, 'users', uid), snap => {
    if (snap.exists()) {
      cb(snap.data().status, snap.data().lastSeen);
    }
  });
}

// Auto set offline on window close
export function initPresenceListener(uid: string) {
  setUserPresence(uid, 'online');

  window.addEventListener('beforeunload', () => {
    setUserPresence(uid, 'offline');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      setUserPresence(uid, 'away');
    } else {
      setUserPresence(uid, 'online');
    }
  });
}
