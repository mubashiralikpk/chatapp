'use client';
import { useEffect } from 'react';
import { subscribeToMessages } from '@/lib/firestore';
import { useChatStore } from '@/store/chatStore';

export function useMessages(chatId: string | null) {
  const { setMessages, messages } = useChatStore();

  useEffect(() => {
    if (!chatId) return;
    const unsub = subscribeToMessages(chatId, setMessages);
    return () => unsub();
  }, [chatId]);

  return messages;
}
