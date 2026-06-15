import { create } from 'zustand';
import { Chat, Message, Room } from '@/types';

interface ChatStore {
  activeChat:     Chat | null;
  activeRoom:     Room | null;
  messages:       Message[];
  chats:          Chat[];
  rooms:          Room[];
  setActiveChat:  (chat: Chat | null) => void;
  setActiveRoom:  (room: Room | null) => void;
  setMessages:    (msgs: Message[]) => void;
  setChats:       (chats: Chat[]) => void;
  setRooms:       (rooms: Room[]) => void;
}

export const useChatStore = create<ChatStore>(set => ({
  activeChat:    null,
  activeRoom:    null,
  messages:      [],
  chats:         [],
  rooms:         [],
  setActiveChat: activeChat => set({ activeChat }),
  setActiveRoom: activeRoom => set({ activeRoom }),
  setMessages:   messages   => set({ messages }),
  setChats:      chats      => set({ chats }),
  setRooms:      rooms      => set({ rooms }),
}));
