'use client';
import { useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateUserEmail, updateUserPassword } from '@/lib/auth';
import { setUserPresence } from '@/lib/presence';
import { UserStatus } from '@/types';
import { Camera, Lock, Mail, User, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES: { value: UserStatus; label: string; color: string }[] = [
  { value: 'online',  label: 'Online',  color: 'bg-green-500'  },
  { value: 'away',    label: 'Away',    color: 'bg-yellow-500' },
  { value: 'busy',    label: 'Busy',    color: 'bg-red-500'    },
  { value: 'offline', label: 'Offline', color: 'bg-slate-500'  },
];

export default function ProfilePanel() {
  const { user }             = useAuthStore();
  const [name, setName]      = useState(user?.name || '');
  const [saving, setSaving]  = useState(false);
  const [tab, setTab]        = useState<'profile' | 'security'>('profile');
  const fileRef              = useRef<HTMLInputElement>(null);

  // Security fields
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd,     setNewPwd]     = useState('');
  const [newEmail,   setNewEmail]   = useState('');

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'users', user.uid), { avatar: url });
      toast.success('Avatar updated!');
    } catch {
      toast.error('Failed to upload avatar');
    }
  };

  const handleSaveName = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { name: name.trim() });
      toast.success('Name updated!');
    } catch {
      toast.error('Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd) return;
    setSaving(true);
    try {
      await updateUserPassword(currentPwd, newPwd);
      toast.success('Password updated!');
      setCurrentPwd(''); setNewPwd('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!currentPwd || !newEmail) return;
    setSaving(true);
    try {
      await updateUserEmail(currentPwd, newEmail);
      await updateDoc(doc(db, 'users', user!.uid), { email: newEmail });
      toast.success('Email updated!');
      setCurrentPwd(''); setNewEmail('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const statusColors: Record<string, string> = {
    online: 'bg-green-500', offline: 'bg-slate-500',
    busy:   'bg-red-500',   away:    'bg-yellow-500',
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600">
      {/* Header */}
      <div className="p-5 border-b border-slate-700">
        <h2 className="text-white font-semibold text-lg mb-4">Profile</h2>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <img src={user?.avatar} alt={user?.name}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-500/30" />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full
                         flex items-center justify-center hover:bg-blue-500 transition"
            >
              <Camera size={14} className="text-white" />
            </button>
            <span className={`absolute top-1 right-1 w-3.5 h-3.5 rounded-full
                              border-2 border-slate-800 ${statusColors[user?.status || 'offline']}`} />
          </div>
          <input ref={fileRef} type="file" accept="image/*"
            onChange={handleAvatarUpload} className="hidden" />

          <div className="text-center">
            <p className="text-white font-semibold">{user?.name}</p>
            <p className="text-slate-400 text-sm">@{user?.username}</p>
          </div>

          {/* Status Selector */}
          <div className="flex gap-2 flex-wrap justify-center">
            {STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => setUserPresence(user!.uid, s.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
                            font-medium transition border
                            ${user?.status === s.value
                              ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                              : 'border-slate-600 text-slate-400 hover:border-slate-500'}`}
              >
                <span className={`w-2 h-2 rounded-full ${s.color}`} />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {(['profile', 'security'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition
                        ${tab === t
                          ? 'text-blue-400 border-b-2 border-blue-500'
                          : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {tab === 'profile' ? (
          <>
            {/* Username (read-only) */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Username (read-only)
              </label>
              <div className="flex items-center gap-2 bg-slate-700/40 border border-slate-600
                              rounded-xl px-4 py-2.5">
                <span className="text-slate-500 text-sm">@</span>
                <span className="text-slate-400 text-sm">{user?.username}</span>
                <Lock size={13} className="ml-auto text-slate-600" />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Display Name
              </label>
              <div className="flex gap-2">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="flex-1 bg-slate-700/60 border border-slate-600 text-white
                             rounded-xl px-4 py-2.5 text-sm focus:outline-none
                             focus:ring-2 focus:ring-blue-500 transition"
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving || name === user?.name}
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700
                             rounded-xl flex items-center justify-center transition"
                >
                  <Check size={16} className="text-white" />
                </button>
              </div>
            </div>

            {/* Email display */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <div className="flex items-center gap-2 bg-slate-700/40 border border-slate-600
                              rounded-xl px-4 py-2.5">
                <Mail size={14} className="text-slate-500" />
                <span className="text-slate-300 text-sm">{user?.email}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Change Email */}
            <div className="bg-slate-700/30 rounded-xl p-4 space-y-3">
              <p className="text-white text-sm font-medium flex items-center gap-2">
                <Mail size={15} className="text-blue-400" /> Change Email
              </p>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="New email"
                className="w-full bg-slate-700 border border-slate-600 text-white
                           placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                value={currentPwd}
                onChange={e => setCurrentPwd(e.target.value)}
                placeholder="Current password"
                className="w-full bg-slate-700 border border-slate-600 text-white
                           placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={handleChangeEmail} disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800
                           text-white rounded-xl py-2.5 text-sm font-medium transition">
                Update Email
              </button>
            </div>

            {/* Change Password */}
            <div className="bg-slate-700/30 rounded-xl p-4 space-y-3">
              <p className="text-white text-sm font-medium flex items-center gap-2">
                <Lock size={15} className="text-blue-400" /> Change Password
              </p>
              <input
                type="password"
                value={currentPwd}
                onChange={e => setCurrentPwd(e.target.value)}
                placeholder="Current password"
                className="w-full bg-slate-700 border border-slate-600 text-white
                           placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                placeholder="New password (min 8 chars)"
                className="w-full bg-slate-700 border border-slate-600 text-white
                           placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={handleChangePassword} disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800
                           text-white rounded-xl py-2.5 text-sm font-medium transition">
                Update Password
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
