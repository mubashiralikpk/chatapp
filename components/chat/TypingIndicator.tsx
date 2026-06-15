'use client';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Props {
  chatId:     string;
  currentUid: string;
}

export default function TypingIndicator({ chatId, currentUid }: Props) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!chatId) return;
    const unsub = onSnapshot(doc(db, 'chats', chatId), snap => {
      if (!snap.exists()) return;
      const typing = snap.data().typing || {};
      const active = Object.entries(typing)
        .filter(([uid, isTyping]) => uid !== currentUid && isTyping)
        .map(([uid]) => uid);
      setTypingUsers(active);
    });
    return () => unsub();
  }, [chatId, currentUid]);

  if (typingUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <div className="flex items-center gap-1 bg-slate-700 rounded-2xl px-3 py-2">
        <span className="flex gap-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
        <span className="text-slate-400 text-xs ml-1">typing…</span>
      </div>
    </div>
  );
}
