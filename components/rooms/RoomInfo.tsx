'use client';
import { useState } from 'react';
import { Room } from '@/types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { X, Hash, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  room:      Room;
  isAdmin:   boolean;
  isCreator: boolean;
  onClose:   () => void;
}

export default function RoomInfo({ room, isAdmin, isCreator, onClose }: Props) {
  const [name,    setName]    = useState(room.name);
  const [desc,    setDesc]    = useState(room.description);
  const [saving,  setSaving]  = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'rooms', room.id), {
        name: name.trim(),
        description: desc.trim(),
      });
      toast.success('Room updated!');
    } catch {
      toast.error('Failed to update room');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-72 bg-slate-800 border-l border-slate-700 flex flex-col
                    overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h3 className="text-white font-semibold">Room Info</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition">
          <X size={18} />
        </button>
      </div>

      {/* Avatar + Name */}
      <div className="flex flex-col items-center p-5 border-b border-slate-700">
        <img src={room.avatar} className="w-20 h-20 rounded-2xl mb-3" alt={room.name} />
        {isAdmin ? (
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-white text-center
                       rounded-xl px-3 py-1.5 text-sm w-full mb-2
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <p className="text-white font-semibold text-lg">{room.name}</p>
        )}
        <p className="text-slate-400 text-xs flex items-center gap-1">
          <Hash size={11} /> {room.memberCount} members
        </p>
      </div>

      {/* Description */}
      <div className="p-4 border-b border-slate-700">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
          Description
        </p>
        {isAdmin ? (
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            rows={3}
            className="w-full bg-slate-700 border border-slate-600 text-white
                       placeholder-slate-400 rounded-xl px-3 py-2 text-sm
                       resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <p className="text-slate-300 text-sm">{room.description || 'No description'}</p>
        )}
      </div>

      {/* Meta */}
      <div className="p-4 space-y-3 border-b border-slate-700">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Created</p>
          <p className="text-slate-300 text-sm mt-0.5">
            {room.createdAt?.toDate
              ? format(room.createdAt.toDate(), 'MMM d, yyyy')
              : 'Unknown'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Visibility</p>
          <p className="text-slate-300 text-sm mt-0.5">
            {room.isPublic ? '🌐 Public' : '🔒 Private'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Capacity</p>
          <p className="text-slate-300 text-sm mt-0.5">
            {room.memberCount} / {room.maxMembers} members
          </p>
        </div>
      </div>

      {/* Save button for admins */}
      {isAdmin && (
        <div className="p-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800
                       text-white rounded-xl py-2.5 text-sm font-medium
                       flex items-center justify-center gap-2 transition"
          >
            <Save size={15} />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
