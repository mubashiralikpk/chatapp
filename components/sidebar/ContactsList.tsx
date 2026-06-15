'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useContacts } from '@/hooks/useContacts';
import { acceptFriendRequest, rejectFriendRequest,
         sendFriendRequest, removeContact } from '@/lib/firestore';
import { getUserByUsername } from '@/lib/auth';
import { getOrCreateChat } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import { User, FriendRequest } from '@/types';
import { Search, UserPlus, MessageCircle,
         UserMinus, Check, X, UserSearch } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactsList() {
  const { user }                        = useAuthStore();
  const { contacts, friendRequests }    = useContacts(user?.uid);
  const [search, setSearch]             = useState('');
  const [addUsername, setAddUsername]   = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding]             = useState(false);
  const router                          = useRouter();

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddFriend = async () => {
    if (!user || !addUsername.trim()) return;
    setAdding(true);
    try {
      const target = await getUserByUsername(addUsername.trim());
      if (!target) throw new Error('User not found.');
      if (target.uid === user.uid) throw new Error("You can't add yourself.");
      if (contacts.find(c => c.uid === target.uid)) throw new Error('Already a contact.');
      await sendFriendRequest(user.uid, target.uid);
      toast.success(`Friend request sent to @${addUsername}`);
      setAddUsername('');
      setShowAddModal(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleStartChat = async (contactUid: string) => {
    if (!user) return;
    const chatId = await getOrCreateChat(user.uid, contactUid);
    router.push(`/chat/${chatId}`);
  };

  const statusColors: Record<string, string> = {
    online:  'bg-green-500',
    offline: 'bg-slate-500',
    busy:    'bg-red-500',
    away:    'bg-yellow-500',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-lg">Contacts</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-blue-600
                       flex items-center justify-center text-slate-400
                       hover:text-white transition"
          >
            <UserPlus size={16} />
          </button>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts…"
            className="w-full bg-slate-700/60 text-white placeholder-slate-400
                       rounded-xl pl-9 pr-4 py-2 text-sm border border-slate-600
                       focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600">
        {/* Pending Requests */}
        {friendRequests.length > 0 && (
          <div className="p-3 border-b border-slate-700">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
              Friend Requests ({friendRequests.length})
            </p>
            {friendRequests.map(req => (
              <FriendRequestItem
                key={req.id}
                request={req}
                onAccept={() => acceptFriendRequest(req.id, req.toUid, req.fromUid)
                  .then(() => toast.success('Friend request accepted!'))}
                onReject={() => rejectFriendRequest(req.id)
                  .then(() => toast.success('Request rejected'))}
              />
            ))}
          </div>
        )}

        {/* Contacts */}
        <div className="p-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <UserSearch size={32} className="mb-2 opacity-40" />
              <p className="text-sm">No contacts found</p>
            </div>
          ) : (
            filtered.map(contact => (
              <div
                key={contact.uid}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                           hover:bg-slate-700/50 transition group"
              >
                <div className="relative flex-shrink-0">
                  <img src={contact.avatar} className="w-10 h-10 rounded-full" alt={contact.name} />
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full
                                    border-2 border-slate-800 ${statusColors[contact.status]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{contact.name}</p>
                  <p className="text-slate-400 text-xs">@{contact.username}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleStartChat(contact.uid)}
                    className="w-7 h-7 rounded-lg bg-blue-600/20 hover:bg-blue-600
                               text-blue-400 hover:text-white flex items-center
                               justify-center transition"
                    title="Message"
                  >
                    <MessageCircle size={14} />
                  </button>
                  <button
                    onClick={() => removeContact(user!.uid, contact.uid)
                      .then(() => toast.success('Contact removed'))}
                    className="w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500
                               text-red-400 hover:text-white flex items-center
                               justify-center transition"
                    title="Remove"
                  >
                    <UserMinus size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Friend Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-semibold text-lg mb-4">Add Friend</h3>
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
              <input
                value={addUsername}
                onChange={e => setAddUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
                placeholder="username"
                className="w-full bg-slate-700 border border-slate-600 text-white
                           placeholder-slate-400 rounded-xl pl-8 pr-4 py-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white
                           rounded-xl py-2.5 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFriend}
                disabled={adding || !addUsername.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800
                           text-white rounded-xl py-2.5 text-sm font-medium transition"
              >
                {adding ? 'Sending…' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FriendRequestItem({
  request, onAccept, onReject,
}: {
  request:  FriendRequest;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-700/40">
      <img
        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${request.fromUid}`}
        className="w-9 h-9 rounded-full"
        alt="requester"
      />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">Friend Request</p>
        <p className="text-slate-400 text-xs">from uid: {request.fromUid.slice(0, 8)}…</p>
      </div>
      <div className="flex gap-1.5">
        <button onClick={onAccept}
          className="w-7 h-7 rounded-full bg-green-500/20 hover:bg-green-500
                     text-green-400 hover:text-white flex items-center justify-center transition">
          <Check size={14} />
        </button>
        <button onClick={onReject}
          className="w-7 h-7 rounded-full bg-red-500/20 hover:bg-red-500
                     text-red-400 hover:text-white flex items-center justify-center transition">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
