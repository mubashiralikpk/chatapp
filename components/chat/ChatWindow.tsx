'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useMessages } from '@/hooks/useMessages';
import { sendMessage, setTyping, markMessagesRead } from '@/lib/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, Message } from '@/types';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { Phone, Video, MoreVertical, Search, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  chatId:  string;
  peerId:  string;
}

export default function ChatWindow({ chatId, peerId }: Props) {
  const { user }                  = useAuthStore();
  const messages                  = useMessages(chatId);
  const [peer, setPeer]           = useState<User | null>(null);
  const [searchMsg, setSearchMsg] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const router                    = useRouter();

  useEffect(() => {
    getDoc(doc(db, 'users', peerId)).then(snap => {
      if (snap.exists()) setPeer({ uid: snap.id, ...snap.data() } as User);
    });
  }, [peerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (user && chatId) markMessagesRead(chatId, user.uid);
  }, [messages.length, chatId, user?.uid]);

  const statusColors: Record<string, string> = {
    online:  'bg-green-500',
    offline: 'bg-slate-500',
    busy:    'bg-red-500',
    away:    'bg-yellow-500',
  };

  const filteredMessages = searchMsg
    ? messages.filter(m => m.content.toLowerCase().includes(searchMsg.toLowerCase()))
    : messages;

  const handleSend = async (content: string, type: Message['type'] = 'text', extra = {}) => {
    if (!user) return;
    await sendMessage(chatId, user.uid, content, type, extra);
    await setTyping(chatId, user.uid, false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-800
                      border-b border-slate-700 shadow-sm">
        <button onClick={() => router.back()}
          className="lg:hidden text-slate-400 hover:text-white transition mr-1">
          <ArrowLeft size={20} />
        </button>

        <div className="relative flex-shrink-0">
          <img
            src={peer?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerId}`}
            className="w-10 h-10 rounded-full object-cover"
            alt={peer?.name}
          />
          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full
                            border-2 border-slate-800 ${statusColors[peer?.status || 'offline']}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{peer?.name}</p>
          <p className="text-xs capitalize flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${statusColors[peer?.status || 'offline']}`} />
            <span className={peer?.status === 'online' ? 'text-green-400' : 'text-slate-400'}>
              {peer?.status || 'offline'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="w-9 h-9 rounded-xl bg-slate-700/60 hover:bg-slate-700
                       flex items-center justify-center text-slate-400
                       hover:text-white transition"
          >
            <Search size={17} />
          </button>
          <button className="w-9 h-9 rounded-xl bg-slate-700/60 hover:bg-slate-700
                             flex items-center justify-center text-slate-400
                             hover:text-white transition">
            <Phone size={17} />
          </button>
          <button className="w-9 h-9 rounded-xl bg-slate-700/60 hover:bg-slate-700
                             flex items-center justify-center text-slate-400
                             hover:text-white transition">
            <Video size={17} />
          </button>
          <button className="w-9 h-9 rounded-xl bg-slate-700/60 hover:bg-slate-700
                             flex items-center justify-center text-slate-400
                             hover:text-white transition">
            <MoreVertical size={17} />
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 py-2 bg-slate-800/80 border-b border-slate-700">
          <input
            value={searchMsg}
            onChange={e => setSearchMsg(e.target.value)}
            placeholder="Search messages…"
            className="w-full bg-slate-700 border border-slate-600 text-white
                       placeholder-slate-400 rounded-xl px-4 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1
                      scrollbar-thin scrollbar-thumb-slate-700">
        {filteredMessages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === user?.uid}
            showAvatar={
              idx === 0 ||
              filteredMessages[idx - 1]?.senderId !== msg.senderId
            }
            chatId={chatId}
          />
        ))}
        <TypingIndicator chatId={chatId} currentUid={user?.uid || ''} />
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        chatId={chatId}
        currentUid={user?.uid || ''}
      />
    </div>
  );
}
