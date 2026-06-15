'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { subscribeToNotifications, markNotificationRead } from '@/lib/firestore';
import { Notification } from '@/types';
import { Bell, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ICONS: Record<string, string> = {
  message:        '💬',
  friend_request: '👤',
  room_invite:    '🏠',
  mention:        '@',
};

export default function NotificationPanel() {
  const { user }                          = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNotifications(user.uid, setNotifications);
    return () => unsub();
  }, [user?.uid]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">Notifications</h2>
        {notifications.length > 0 && (
          <button
            onClick={() => notifications.forEach(n => markNotificationRead(n.id))}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <Check size={13} /> Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <Bell size={32} className="mb-2 opacity-40" />
            <p className="text-sm">No new notifications</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              className="flex items-start gap-3 px-4 py-3 border-b border-slate-700/40
                         hover:bg-slate-700/30 transition"
            >
              <span className="text-xl flex-shrink-0 mt-0.5">
                {ICONS[notif.type] || '🔔'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{notif.title}</p>
                <p className="text-slate-400 text-xs mt-0.5">{notif.body}</p>
                <p className="text-slate-500 text-xs mt-1">
                  {notif.createdAt?.toDate
                    ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })
                    : 'Just now'}
                </p>
              </div>
              <button
                onClick={() => markNotificationRead(notif.id)}
                className="text-slate-500 hover:text-blue-400 transition flex-shrink-0"
              >
                <Check size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
