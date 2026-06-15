'use client';
import { useEffect, useState } from 'react';
import { Room, User } from '@/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { kickMember, banUser, unbanUser,
         promoteToAdmin, demoteAdmin } from '@/lib/firestore';
import { getOrCreateChat } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import {
  X, Shield, ShieldOff, UserX,
  Ban, MessageCircle, Crown,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  room:       Room;
  isAdmin:    boolean;
  isCreator:  boolean;
  currentUid: string;
  onClose:    () => void;
}

export default function MembersList({ room, isAdmin, isCreator, currentUid, onClose }: Props) {
  const [members,  setMembers]  = useState<User[]>([]);
  const [showBans, setShowBans] = useState(false);
  const router                  = useRouter();

  useEffect(() => {
    const load = async () => {
      const users = await Promise.all(
        room.members.map(async uid => {
          const snap = await getDoc(doc(db, 'users', uid));
          return snap.exists() ? ({ uid: snap.id, ...snap.data() } as User) : null;
        })
      );
      setMembers(users.filter(Boolean) as User[]);
    };
    load();
  }, [room.members]);

  const handleStartChat = async (uid: string) => {
    const chatId = await getOrCreateChat(currentUid, uid);
    router.push(`/chat/${chatId}`);
    onClose();
  };

  const statusColors: Record<string, string> = {
    online:  'bg-green-500',
    offline: 'bg-slate-500',
    busy:    'bg-red-500',
    away:    'bg-yellow-500',
  };

  return (
    <div className="w-72 bg-slate-800 border-l border-slate-700 flex flex-col
                    overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex gap-2">
          <button
            onClick={() => setShowBans(false)}
            className={`text-sm font-medium px-3 py-1 rounded-lg transition
                        ${!showBans ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Members
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowBans(true)}
              className={`text-sm font-medium px-3 py-1 rounded-lg transition
                          ${showBans ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Banned
            </button>
          )}
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition">
          <X size={18} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 p-2">
        {!showBans ? (
          members.map(member => {
            const isMemberAdmin   = room.admins.includes(member.uid);
            const isMemberCreator = room.creatorId === member.uid;
            const isSelf          = member.uid === currentUid;

            return (
              <div key={member.uid}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                           hover:bg-slate-700/50 transition group">
                <div className="relative flex-shrink-0">
                  <img src={member.avatar} className="w-9 h-9 rounded-full" alt={member.name} />
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full
                                    border-2 border-slate-800 ${statusColors[member.status]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-white text-sm font-medium truncate">{member.name}</p>
                    {isMemberCreator && (
                      <Crown size={12} className="text-yellow-400 flex-shrink-0" title="Creator" />
                    )}
                    {isMemberAdmin && !isMemberCreator && (
                      <Shield size={12} className="text-blue-400 flex-shrink-0" title="Admin" />
                    )}
                  </div>
                  <p className="text-slate-400 text-xs">@{member.username}</p>
                </div>

                {/* Actions (only for admins, not self, not creator) */}
                {isAdmin && !isSelf && !isMemberCreator && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleStartChat(member.uid)}
                      className="w-6 h-6 rounded-lg bg-blue-600/20 hover:bg-blue-600
                                 text-blue-400 hover:text-white flex items-center
                                 justify-center transition" title="Message">
                      <MessageCircle size={12} />
                    </button>
                    {!isMemberAdmin ? (
                      <button
                        onClick={() => promoteToAdmin(room.id, member.uid)
                          .then(() => toast.success('Promoted to admin'))}
                        className="w-6 h-6 rounded-lg bg-blue-600/20 hover:bg-blue-600
                                   text-blue-400 hover:text-white flex items-center
                                   justify-center transition" title="Promote">
                        <Shield size={12} />
                      </button>
                    ) : (
                      <button
                        onClick={() => demoteAdmin(room.id, member.uid)
                          .then(() => toast.success('Admin removed'))}
                        className="w-6 h-6 rounded-lg bg-yellow-600/20 hover:bg-yellow-600
                                   text-yellow-400 hover:text-white flex items-center
                                   justify-center transition" title="Demote">
                        <ShieldOff size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => kickMember(room.id, member.uid)
                        .then(() => toast.success('Member kicked'))}
                      className="w-6 h-6 rounded-lg bg-orange-600/20 hover:bg-orange-600
                                 text-orange-400 hover:text-white flex items-center
                                 justify-center transition" title="Kick">
                      <UserX size={12} />
                    </button>
                    <button
                      onClick={() => banUser(room.id, member.uid)
                        .then(() => toast.success('User banned'))}
                      className="w-6 h-6 rounded-lg bg-red-600/20 hover:bg-red-600
                                 text-red-400 hover:text-white flex items-center
                                 justify-center transition" title="Ban">
                      <Ban size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          // Banned users list
          room.bannedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-500">
              <Ban size={28} className="mb-2 opacity-40" />
              <p className="text-sm">No banned users</p>
            </div>
          ) : (
            room.bannedUsers.map(uid => (
              <div key={uid}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                           hover:bg-slate-700/50 transition">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`}
                  className="w-9 h-9 rounded-full opacity-50"
                  alt="banned"
                />
                <p className="text-slate-400 text-sm flex-1 truncate">{uid.slice(0, 12)}…</p>
                <button
                  onClick={() => unbanUser(room.id, uid)
                    .then(() => toast.success('User unbanned'))}
                  className="text-xs bg-green-600/20 hover:bg-green-600 text-green-400
                             hover:text-white px-2 py-1 rounded-lg transition"
                >
                  Unban
                </button>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
