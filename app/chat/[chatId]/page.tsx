'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import ChatWindow from '@/components/chat/ChatWindow';

export default function ChatPage() {
  const { chatId }          = useParams<{ chatId: string }>();
  const { user }            = useAuthStore();
  const [peerId, setPeerId] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId || !user) return;
    getDoc(doc(db, 'chats', chatId)).then(snap => {
      if (!snap.exists()) return;
      const participants: string[] = snap.data().participants;
      const peer = participants.find(p => p !== user.uid);
      if (peer) setPeerId(peer);
    });
  }, [chatId, user?.uid]);

  if (!peerId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent
                        rounded-full animate-spin" />
      </div>
    );
  }

  return <ChatWindow chatId={chatId} peerId={peerId} />;
}
