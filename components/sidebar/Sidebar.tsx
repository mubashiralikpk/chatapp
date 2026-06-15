'use client';
import { useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useContacts } from '@/hooks/useContacts';
import { subscribeToNotifications } from '@/lib/firestore';
import { logoutUser } from '@/lib/auth';
import ChatList from './ChatList';
import RoomsList from './RoomsList';
import ContactsList from './ContactsList';
import NotificationPanel from './NotificationPanel';
import ProfilePanel from './ProfilePanel';
import {
  MessageCircle, Users, UserPlus, Bell,
  User, LogOut, Hash, Menu, X,
} from 'lucide-react';
import { useEffect, useState as useS } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const NAV = [
  { id: 'chats',         icon: MessageCircle, label: 'Chats'         },
  { id: 'rooms',         icon: Hash,          label: 'Rooms'         },
  { id: 'contacts',      icon: Users,         label: 'Contacts'      },
  { id: 'notifications', icon: Bell,          label: 'Notifications' },
  { id: 'profile',       icon: User,          label: 'Profile'       },
] as const;

export default function Sidebar() {
  const { activePanel, setActivePanel, sidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNotifications(user.uid, notifs => {
      setUnreadNotifs(notifs.length);
    });
    return () => unsub();
  }, [user?.uid]);

  const handleLogout = async () => {
    await logoutUser();
    toast.success('Logged out');
    router.push('/login');
  };

  const statusColors: Record<string, string> = {
    online:  'bg-green-500',
    offline: 'bg-slate-500',
    busy:    'bg-red-500',
    away:    'bg-yellow-500',
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden"
             onClick={toggleSidebar} />
      )}

      <aside className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        fixed lg:relative z-30
        h-full flex transition-transform duration-300
        w-80 bg-slate-800 border-r border-slate-700
      `}>
        {/* ── Icon Rail ── */}
        <div className="w-16 bg-slate-900 flex flex-col items-center py-4 gap-1 border-r border-slate-700">
          {/* Avatar */}
          <div className="relative mb-3 cursor-pointer" onClick={() => setActivePanel('profile')}>
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500"
            />
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2
                              border-slate-900 ${statusColors[user?.status || 'offline']}`} />
          </div>

          {/* Nav icons */}
          {NAV.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActivePanel(id)}
              title={label}
              className={`relative w-11 h-11 rounded-xl flex items-center justify-center
                          transition-all duration-200
                          ${activePanel === id
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
            >
              <Icon size={20} />
              {id === 'notifications' && unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white
                                 text-[10px] font-bold rounded-full w-4 h-4
                                 flex items-center justify-center">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </button>
          ))}

          {/* Spacer + Logout */}
          <div className="flex-1" />
          <button
            onClick={handleLogout}
            title="Logout"
            className="w-11 h-11 rounded-xl flex items-center justify-center
                       text-slate-400 hover:bg-red-500/20 hover:text-red-400
                       transition-all duration-200 mb-2"
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* ── Panel Content ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activePanel === 'chats'         && <ChatList />}
          {activePanel === 'rooms'         && <RoomsList />}
          {activePanel === 'contacts'      && <ContactsList />}
          {activePanel === 'notifications' && <NotificationPanel />}
          {activePanel === 'profile'       && <ProfilePanel />}
        </div>
      </aside>
    </>
  );
}
