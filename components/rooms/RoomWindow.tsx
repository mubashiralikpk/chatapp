'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { subscribeToRoomMessages, sendRoomMessage,
         kickMember, banUser, promoteToAdmin,
         demoteAdmin, leaveRoom, deleteRoom } from '@/lib/firestore';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Room, Message, User } from '@/types';
import MessageBubble from '../chat/MessageBubble';
import MessageInput from '../chat/MessageInput';
import TypingIndicator from '../chat/TypingIndicator';
import RoomInfo from './RoomInfo';
import MembersList from './MembersList';
import {
  Hash, Users, Info, Settings,
  LogOut, Trash2, ArrowLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function RoomWindow({ roomId }: { roomId: string }) {
  const { user }                    = useAuthStore();
  const [room, setRoom]             = useState<Room | null>(null);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [showInfo, setShowInfo]     = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [replyTo, setReplyTo]       = useState<Message | null>(null);
  const bottomRef                   = useRef<HTMLDivElement>(null);
  const router                      = useRouter();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'rooms', roomId), snap => {
      if (snap.exists()) setRoom({ id: snap.id, ...snap.data() } as Room);
    });
    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    const unsub = subscribeToRoomMessages(roomId, setMessages);
    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isAdmin   = room?.admins.includes(user?.uid || '') || false;
  const isCreator = room?.creatorId === user?.uid;

  const handleSend = async (
    content: string,
    type: Message['type'] = 'text',
    extra = {}
  ) => {
    if (!user || !room) return;
    if (room.bannedUsers.includes(user.uid)) {
      toast.error('You are banned from this room.');
      return;
    }
    await sendRoomMessage(roomId, user.uid, content, type, extra);
    setReplyTo(null);
  };

  const handleLeave = async () => {
    if (!user) return;
    await leaveRoom(roomId, user.uid);
    toast.success('Left room');
    router.push('/rooms');
  };

  const handleDelete = async () => {
    if (!isCreator) return;
    if (!confirm('Delete this room permanently?')) return;
    await deleteRoom(roomId);
    toast.success('Room deleted');
    router.push('/rooms');
  };

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent
                        rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-900">
      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-800
                        border-b border-slate-700 shadow-sm">
          <button onClick={() => router.back()}
            className="lg:hidden text-slate-400 hover:text-white transition">
            <ArrowLeft size={20} />
          </button>

          <img
            src={room.avatar}
            className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
            alt={room.name}
          />

          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm flex items-center gap-2">
              <Hash size={14} className="text-slate-400" />
              {room.name}
            </p>
            <p className="text-slate-400 text-xs flex items-center gap-1">
              <Users size={11} />
              {room.memberCount} / {room.maxMembers} members
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowMembers(!showMembers); setShowInfo(false); }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center
                          transition ${showMembers
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700/60 hover:bg-slate-700 text-slate-400 hover:text-white'}`}
            >
              <Users size={17} />
            </button>
            <button
              onClick={() => { setShowInfo(!showInfo); setShowMembers(false); }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center
                          transition ${showInfo
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700/60 hover:bg-slate-700 text-slate-400 hover:text-white'}`}
            >
              <Info size={17} />
            </button>
            <button
              onClick={handleLeave}
              className="w-9 h-9 rounded-xl bg-slate-700/60 hover:bg-red-600/30
                         flex items-center justify-center text-slate-400
                         hover:text-red-400 transition"
              title="Leave room"
            >
              <LogOut size={17} />
            </button>
            {isCreator && (
              <button
                onClick={handleDelete}
                className="w-9 h-9 rounded-xl bg-slate-700/60 hover:bg-red-600
                           flex items-center justify-center text-slate-400
                           hover:text-white transition"
                title="Delete room"
              >
                <Trash2 size={17} />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1
                        scrollbar-thin scrollbar-thumb-slate-700">
          {messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === user?.uid}
              showAvatar={
                idx === 0 ||
                messages[idx - 1]?.senderId !== msg.senderId
              }
              chatId={roomId}
            />
          ))}
          <TypingIndicator chatId={roomId} currentUid={user?.uid || ''} />
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <MessageInput
          onSend={handleSend}
          chatId={roomId}
          currentUid={user?.uid || ''}
          replyTo={replyTo}
          onClearReply={() => setReplyTo(null)}
        />
      </div>

      {/* Side panels */}
      {showInfo && (
        <RoomInfo room={room} isAdmin={isAdmin} isCreator={isCreator}
          onClose={() => setShowInfo(false)} />
      )}
      {showMembers && (
        <MembersList room={room} isAdmin={isAdmin} isCreator={isCreator}
          currentUid={user?.uid || ''} onClose={() => setShowMembers(false)} />
      )}
    </div>
  );
}
