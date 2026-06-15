'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { subscribeToChats } from '@/lib/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Chat, User } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Search, MessageCirclePlus } from 'lucide-react';

export default function ChatList() {
  const { user }              = useAuthStore();
  const { chats, setChats }   = useChatStore();
  const [search, setSearch]   = useState('');
  const [peerMap, setPeerMap] = useState<Record<string, User>>({});
  const router                = useRouter();

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToChats(user.uid, setChats);
    return () => unsub();
  }, [user?.uid]);

  // Load peer user info for each chat
  useEffect(() => {
    if (!user || !chats.length) return;
    chats.forEach(async chat => {
      const peerId = chat.participants.find(p => p !== user.uid);
      if (!peerId || peerMap[peerId]) return;
      const snap = await getDoc(doc(db, 'users', peerId));
      if (snap.exists()) {
        setPeerMap(prev => ({ ...prev, [peerId]: { uid: snap.id, ...snap.data() } as User }));
      }
    });
  }, [chats]);

  const statusDot: Record<string, string> = {
    online:  'bg-green-500',
    offline: 'bg-slate-500',
    busy:    'bg-red-500',
    away:    'bg-yellow-500',
  };

  const filtered = chats.filter(chat => {
    const peerId = chat.participants.find(p => p !== user?.uid);
    const peer   = peerId ? peerMap[peerId] : null;
    return peer?.name.toLowerCase().includes(search.toLowerCase())
        || peer?.username.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-lg">Chats</h2>
          <button className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-blue-600
                             flex items-center justify-center text-slate-400
                             hover:text-white transition">
            <MessageCirclePlus size={16} />
          </button>
        </div>
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search chats…"
            className="w-full bg-slate-700/60 text-white placeholder-slate-400
                       rounded-xl pl-9 pr-4 py-2 text-sm border border-slate-600
                       focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <MessageCirclePlus size={32} className="mb-2 opacity-40" />
            <p className="text-sm">No chats yet</p>
          </div>
        ) : (
          filtered.map(chat => {
            const peerId  = chat.participants.find(p => p !== user?.uid)!;
            const peer    = peerMap[peerId];
            const unread  = chat.unreadCount?.[user?.uid || ''] || 0;
            const lastMsg = chat.lastMessage;

            return (
              <button
                key={chat.id}
                onClick={() => router.push(`/chat/${chat.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3
                           hover:bg-slate-700/50 transition-colors text-left
                           border-b border-slate-700/40"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={peer?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerId}`}
                    className="w-11 h-11 rounded-full object-cover"
                    alt={peer?.name}
                  />
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full
                                    border-2 border-slate-800
                                    ${statusDot[peer?.status || 'offline']}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-medium truncate">
                      {peer?.name || 'Loading…'}
                    </span>
                    <span className="text-slate-500 text-xs flex-shrink-0 ml-2">
                      {lastMsg?.createdAt?.toDate
                        ? formatDistanceToNow(lastMsg.createdAt.toDate(), { addSuffix: false })
                        : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-slate-400 text-xs truncate">
                      {lastMsg?.deleted
                        ? '🚫 Message deleted'
                        : lastMsg?.type === 'image'
                        ? '📷 Photo'
                        : lastMsg?.type === 'file'
                        ? '📎 File'
                        : lastMsg?.content || 'No messages yet'}
                    </span>
                    {unread > 0 && (
                      <span className="flex-shrink-0 ml-2 bg-blue-600 text-white
                                       text-[10px] font-bold rounded-full
                                       w-5 h-5 flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
