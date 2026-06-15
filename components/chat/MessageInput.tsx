'use client';
import { useState, useRef, useEffect } from 'react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { setTyping } from '@/lib/firestore';
import { Message } from '@/types';
import {
  Send, Paperclip, Image, Smile, Mic, X,
} from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

interface Props {
  onSend:      (content: string, type?: Message['type'], extra?: any) => void;
  chatId:      string;
  currentUid:  string;
  replyTo?:    Message | null;
  onClearReply?: () => void;
}

export default function MessageInput({
  onSend, chatId, currentUid, replyTo, onClearReply,
}: Props) {
  const [text,         setText]         = useState('');
  const [showEmoji,    setShowEmoji]    = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [recording,   setRecording]    = useState(false);
  const fileRef                         = useRef<HTMLInputElement>(null);
  const imageRef                        = useRef<HTMLInputElement>(null);
  const typingTimer                     = useRef<NodeJS.Timeout>();
  const textareaRef                     = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  const handleTyping = (val: string) => {
    setText(val);
    setTyping(chatId, currentUid, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setTyping(chatId, currentUid, false);
    }, 2000);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed, 'text', replyTo ? { replyTo: replyTo.id, replyMsg: replyTo } : {});
    setText('');
    setShowEmoji(false);
    onClearReply?.();
    setTyping(chatId, currentUid, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setText(prev => prev + emojiData.emoji);
    textareaRef.current?.focus();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `chat-images/${chatId}/${uuidv4()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      onSend(url, 'image', { fileUrl: url });
      toast.success('Image sent!');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `chat-files/${chatId}/${uuidv4()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      onSend(file.name, 'file', { fileUrl: url, fileName: file.name });
      toast.success('File sent!');
    } catch {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-slate-800 border-t border-slate-700 px-4 py-3">
      {/* Reply Preview */}
      {replyTo && (
        <div className="flex items-center gap-3 bg-slate-700/60 rounded-xl
                        px-3 py-2 mb-2 border-l-4 border-blue-500">
          <div className="flex-1 min-w-0">
            <p className="text-blue-400 text-xs font-medium">Replying to</p>
            <p className="text-slate-300 text-xs truncate">{replyTo.content}</p>
          </div>
          <button onClick={onClearReply}
            className="text-slate-400 hover:text-white transition flex-shrink-0">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="absolute bottom-20 right-4 z-50">
          <EmojiPicker
            theme={Theme.DARK}
            onEmojiClick={handleEmojiClick}
            height={380}
            width={320}
          />
        </div>
      )}

      {/* Input Row */}
      <div className="flex items-end gap-2">
        {/* Attachment buttons */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => imageRef.current?.click()}
            disabled={uploading}
            className="w-9 h-9 rounded-xl bg-slate-700/60 hover:bg-slate-700
                       flex items-center justify-center text-slate-400
                       hover:text-white transition disabled:opacity-50"
            title="Send image"
          >
            <Image size={17} />
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-9 h-9 rounded-xl bg-slate-700/60 hover:bg-slate-700
                       flex items-center justify-center text-slate-400
                       hover:text-white transition disabled:opacity-50"
            title="Attach file"
          >
            <Paperclip size={17} />
          </button>
        </div>

        {/* Text area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            className="w-full bg-slate-700/60 border border-slate-600 text-white
                       placeholder-slate-400 rounded-2xl px-4 py-2.5 pr-10 text-sm
                       resize-none focus:outline-none focus:ring-2 focus:ring-blue-500
                       transition scrollbar-none"
          />
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="absolute right-3 bottom-2.5 text-slate-400 hover:text-yellow-400
                       transition"
          >
            <Smile size={18} />
          </button>
        </div>

        {/* Send / Mic */}
        {text.trim() ? (
          <button
            onClick={handleSend}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-500 rounded-xl
                       flex items-center justify-center text-white transition
                       shadow-lg shadow-blue-600/30 flex-shrink-0"
          >
            <Send size={17} />
          </button>
        ) : (
          <button
            className="w-10 h-10 bg-slate-700/60 hover:bg-slate-700 rounded-xl
                       flex items-center justify-center text-slate-400
                       hover:text-white transition flex-shrink-0"
            title="Voice note (coming soon)"
          >
            <Mic size={17} />
          </button>
        )}
      </div>

      {/* Hidden file inputs */}
      <input ref={imageRef} type="file" accept="image/*"
        onChange={handleImageUpload} className="hidden" />
      <input ref={fileRef} type="file"
        onChange={handleFileUpload} className="hidden" />

      {uploading && (
        <p className="text-xs text-blue-400 mt-1 text-center animate-pulse">
          Uploading…
        </p>
      )}
    </div>
  );
}
