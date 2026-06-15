'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, FriendRequest } from '@/types';
import { subscribeToFriendRequests } from '@/lib/firestore';

export function useContacts(uid: string | undefined) {
  const [contacts,       setContacts]       = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

  useEffect(() => {
    if (!uid) return;

    // Subscribe to friend requests
    const unsubReq = subscribeToFriendRequests(uid, setFriendRequests);

    // Subscribe to user's contacts array
    const unsubUser = onSnapshot(doc(db, 'users', uid), async snap => {
      if (!snap.exists()) return;
      const contactUids: string[] = snap.data().contacts || [];
      if (contactUids.length === 0) { setContacts([]); return; }

      const contactDocs = await Promise.all(
        contactUids.map(id => getDoc(doc(db, 'users', id)))
      );
      setContacts(
        contactDocs
          .filter(d => d.exists())
          .map(d => ({ uid: d.id, ...d.data() } as User))
      );
    });

    return () => { unsubReq(); unsubUser(); };
  }, [uid]);

  return { contacts, friendRequests };
}
