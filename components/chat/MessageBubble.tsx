'use client';
import { useState } from 'react';
import { Message } from '@/types';
import { editMessage, deleteMessage, pinMessage } from '@/lib/firestore';
import { format } from 'date-fns';
import {
  Check, CheckCheck, Pencil, Trash2, Reply,
  Copy, Pin, MoreHorizontal, Forward,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  message:    Message;
  isOwn:      boolean;
  showAvatar: boolean;
  chatId:     string;
}

export default function MessageBubble({ message, isOwn, showAvatar, chatId }: Props) {
  const [showActions, setShowActions] = useState(false);
  const [editing,     setEditing]     = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  if (message.deleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
        <span className="text-slate-500 text-xs italic px-3 py-1.5 bg-slate-800/60
                         rounded-xl border border-slate-700">
          🚫 This message was deleted
        </span>
      </div>
    );
  }

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === message.content) {
      setEditing(false); return;
    }
    await editMessage(chatId, message.id, editContent.trim());
    setEditing(false);
    toast.success('Message edited');
  };

  const handleDelete = async () => {
    await deleteMessage(chatId, message.id);
    toast.success('Message deleted');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success('Copied!');
  };

  const handlePin = async () => {
    await pinMessage(chatId, message.id, !message.pinned);
    toast.success(message.pinned ? 'Unpinned' : 'Pinned');
  };

  const time = message.createdAt?.toDate
    ? format(message.createdAt.toDate(), 'HH:mm')
    : '';

  const isRead = message.readBy?.length > 1;

  return (
    <div
      className={`flex items-end gap-2 mb-1 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar (for others) */}
      {!isOwn && (
        <div className="w-7 h-7 flex-shrink-0">
          {showAvatar && (
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderId}`}
              className="w-7 h-7 rounded-full"
              alt="sender"
            />
          )}
        </div>
      )}

      {/* Bubble */}
      <div className={`relative max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Reply preview */}
        {message.replyTo && message.replyMsg && (
          <div className={`text-xs px-3 py-1.5 rounded-t-xl mb-0.5 border-l-2
                           ${isOwn
                             ? 'bg-blue-900/40 border-blue-400 text-blue-300'
                             : 'bg-slate-700/60 border-slate-500 text-slate-400'}`}>
            <p className="font-medium">Reply</p>
            <p className="truncate">{message.replyMsg.content}</p>
          </div>
        )}

        {/* Pin indicator */}
        {message.pinned && (
          <div className="flex items-center gap-1 text-yellow-500 text-xs mb-1">
            <Pin size={11} /> Pinned
          </div>
        )}

        <div className={`px-4 py-2.5 rounded-2xl shadow-sm
                         ${isOwn
                           ? 'bg-blue-600 text-white rounded-br-sm'
                           : 'bg-slate-700 text-slate-100 rounded-bl-sm'}`}>
          {editing ? (
            <div className="flex gap-2 items-center">
              <input
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEdit()}
                className="bg-transparent border-b border-white/50 text-white
                           text-sm outline-none min-w-[120px]"
                autoFocus
              />
              <button onClick={handleEdit}
                className="text-white/70 hover:text-white text-xs">✓</button>
              <button onClick={() => setEditing(false)}
                className="text-white/70 hover:text-white text-xs">✕</button>
            </div>
          ) : (
            <>
              {/* Image */}
              {message.type === 'image' && message.fileUrl && (
                <img src={message.fileUrl} alt="img"
                  className="rounded-xl max-w-[240px] mb-2 cursor-pointer"
                  onClick={() => window.open(message.fileUrl, '_blank')}
                />
              )}
              {/* File */}
              {message.type === 'file' && message.fileUrl && (
                <a href={message.fileUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm underline">
                  📎 {message.fileName || 'Download file'}
                </a>
              )}
              {/* Text */}
              {(message.type === 'text' || !message.type) && (
                <p className="text-sm leading-relaxed break-words">{message.content}</p>
              )}
            </>
          )}

          {/* Footer */}
          <div className={`flex items-center gap-1.5 mt-1
                           ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-[10px] ${isOwn ? 'text-blue-200' : 'text-slate-400'}`}>
              {time}
            </span>
            {message.edited && (
              <span className={`text-[10px] ${isOwn ? 'text-blue-200' : 'text-slate-400'}`}>
                · edited
              </span>
            )}
            {isOwn && (
              isRead
                ? <CheckCheck size={13} className="text-blue-200" />
                : <Check      size={13} className="text-blue-300" />
            )}
          </div>
        </div>

        {/* Reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <span key={emoji}
                className="bg-slate-700 border border-slate-600 rounded-full
                           px-2 py-0.5 text-xs flex items-center gap-1">
                {emoji} <span className="text-slate-400">{users.length}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100
                         transition-opacity ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <button onClick={handleCopy}
            className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600
                       flex items-center justify-center text-slate-400 hover:text-white transition"
            title="Copy">
            <Copy size={13} />
          </button>
          {isOwn && (
            <button onClick={() => setEditing(true)}
              className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600
                         flex items-center justify-center text-slate-400
                         hover:text-white transition" title="Edit">
              <Pencil size={13} />
            </button>
          )}
          {isOwn && (
            <button onClick={handleDelete}
              className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-red-600
                         flex items-center justify-center text-slate-400
                         hover:text-white transition" title="Delete">
              <Trash2 size={13} />
            </button>
          )}
          <button onClick={handlePin}
            className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-yellow-600/60
                       flex items-center justify-center text-slate-400
                       hover:text-yellow-300 transition" title="Pin">
            <Pin size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
