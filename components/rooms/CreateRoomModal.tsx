'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { createRoom } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import { X, Hash, Globe, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateRoomModal({ onClose }: { onClose: () => void }) {
  const { user }                    = useAuthStore();
  const [name, setName]             = useState('');
  const [desc, setDesc]             = useState('');
  const [isPublic, setIsPublic]     = useState(true);
  const [creating, setCreating]     = useState(false);
  const router                      = useRouter();

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    setCreating(true);
    try {
      const roomId = await createRoom(
        user.uid, name.trim(), desc.trim(),
        `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`,
        isPublic
      );
      toast.success('Room created!');
      onClose();
      router.push(`/rooms/${roomId}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl
                      w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h3 className="text-white font-semibold text-lg">Create Room</h3>
          <button onClick={onClose}
            className="text-slate-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Room name */}
          <div>
            <label className="block text-xs font-medium text-slate-400
                               uppercase tracking-wider mb-1.5">
              Room Name *
            </label>
            <div className="relative">
              <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="my-awesome-room"
                maxLength={50}
                className="w-full bg-slate-700 border border-slate-600 text-white
                           placeholder-slate-400 rounded-xl pl-9 pr-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-400
                               uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="What's this room about?"
              rows={3}
              maxLength={200}
              className="w-full bg-slate-700 border border-slate-600 text-white
                         placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm
                         resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-xs font-medium text-slate-400
                               uppercase tracking-wider mb-2">
              Visibility
            </label>
            <div className="flex gap-3">
              {[
                { val: true,  icon: Globe, label: 'Public',  sub: 'Anyone can join' },
                { val: false, icon: Lock,  label: 'Private', sub: 'Invite only'     },
              ].map(({ val, icon: Icon, label, sub }) => (
                <button
                  key={String(val)}
                  onClick={() => setIsPublic(val)}
                  className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl
                              border transition
                              ${isPublic === val
                                ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                                : 'border-slate-600 text-slate-400 hover:border-slate-500'}`}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs opacity-70">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Max members note */}
          <p className="text-slate-500 text-xs flex items-center gap-1.5">
            <span className="text-yellow-500">⚠</span>
            Maximum 25 members per room
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white
                       rounded-xl py-2.5 text-sm font-medium transition">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800
                       disabled:cursor-not-allowed text-white rounded-xl py-2.5
                       text-sm font-medium transition"
          >
            {creating ? 'Creating…' : 'Create Room'}
          </button>
        </div>
      </div>
    </div>
  );
}
