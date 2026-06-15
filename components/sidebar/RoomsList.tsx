'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { subscribeToRooms, searchPublicRooms, joinRoom } from '@/lib/firestore';
import { Room } from '@/types';
import { Search, Plus, Hash, Users, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import CreateRoomModal from '../rooms/CreateRoomModal';

export default function RoomsList() {
  const { user }                            = useAuthStore();
  const { rooms, setRooms }                 = useChatStore();
  const [search, setSearch]                 = useState('');
  const [publicRooms, setPublicRooms]       = useState<Room[]>([]);
  const [showCreate, setShowCreate]         = useState(false);
  const [showDiscover, setShowDiscover]     = useState(false);
  const [discoverSearch, setDiscoverSearch] = useState('');
  const router                              = useRouter();

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToRooms(user.uid, setRooms);
    return () => unsub();
  }, [user?.uid]);

  const handleDiscover = async () => {
    setShowDiscover(true);
    const results = await searchPublicRooms(discoverSearch);
    setPublicRooms(results);
  };

  const handleJoinRoom = async (roomId: string) => {
    if (!user) return;
    try {
      await joinRoom(roomId, user.uid);
      toast.success('Joined room!');
      setShowDiscover(false);
      router.push(`/rooms/${roomId}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filtered = rooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-lg">Rooms</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowDiscover(true)}
              className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600
                         flex items-center justify-center text-slate-400
                         hover:text-white transition" title="Discover rooms">
              <Globe size={16} />
            </button>
            <button onClick={() => setShowCreate(true)}
              className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-blue-600
                         flex items-center justify-center text-slate-400
                         hover:text-white transition" title="Create room">
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search rooms…"
            className="w-full bg-slate-700/60 text-white placeholder-slate-400
                       rounded-xl pl-9 pr-4 py-2 text-sm border border-slate-600
                       focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <Hash size={32} className="mb-2 opacity-40" />
            <p className="text-sm">No rooms yet</p>
            <button onClick={() => setShowCreate(true)}
              className="mt-2 text-blue-400 text-xs hover:text-blue-300">
              Create one
            </button>
          </div>
        ) : (
          filtered.map(room => (
            <button
              key={room.id}
              onClick={() => router.push(`/rooms/${room.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3
                         hover:bg-slate-700/50 transition text-left
                         border-b border-slate-700/40"
            >
              <img
                src={room.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${room.id}`}
                className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                alt={room.name}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium truncate">{room.name}</span>
                  <span className="flex items-center gap-1 text-slate-500 text-xs flex-shrink-0 ml-2">
                    <Users size={11} />{room.memberCount}
                  </span>
                </div>
                <p className="text-slate-400 text-xs truncate mt-0.5">
                  {room.lastMessage?.content || room.description || 'No messages yet'}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Create Room Modal */}
      {showCreate && <CreateRoomModal onClose={() => setShowCreate(false)} />}

      {/* Discover Rooms Modal */}
      {showDiscover && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl
                          w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-lg">Discover Rooms</h3>
                <button onClick={() => setShowDiscover(false)}
                  className="text-slate-400 hover:text-white transition">✕</button>
              </div>
              <div className="flex gap-2">
                <input
                  value={discoverSearch}
                  onChange={e => setDiscoverSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleDiscover()}
                  placeholder="Search public rooms…"
                  className="flex-1 bg-slate-700 border border-slate-600 text-white
                             placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={handleDiscover}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl
                             px-4 py-2.5 text-sm font-medium transition">
                  Search
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {publicRooms.map(room => (
                <div key={room.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50">
                  <img
                    src={room.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${room.id}`}
                    className="w-10 h-10 rounded-xl object-cover"
                    alt={room.name}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{room.name}</p>
                    <p className="text-slate-400 text-xs flex items-center gap-1">
                      <Users size={11} /> {room.memberCount} members
                    </p>
                  </div>
                  {!room.members.includes(user?.uid || '') ? (
                    <button onClick={() => handleJoinRoom(room.id)}
                      className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg
                                 px-3 py-1.5 text-xs font-medium transition">
                      Join
                    </button>
                  ) : (
                    <span className="text-green-400 text-xs font-medium">Joined</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
