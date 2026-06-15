export type UserStatus = 'online' | 'offline' | 'busy' | 'away';

export interface User {
  uid:          string;
  username:     string;
  name:         string;
  email:        string;
  avatar:       string;
  status:       UserStatus;
  lastSeen:     any;
  createdAt:    any;
  bio?:         string;
  blockedUsers: string[];
}

export interface FriendRequest {
  id:         string;
  fromUid:    string;
  toUid:      string;
  status:     'pending' | 'accepted' | 'rejected';
  createdAt:  any;
  fromUser?:  User;
}

export interface Message {
  id:          string;
  chatId:      string;
  senderId:    string;
  content:     string;
  type:        'text' | 'image' | 'file' | 'voice';
  fileUrl?:    string;
  fileName?:   string;
  replyTo?:    string;
  replyMsg?:   Message;
  edited:      boolean;
  deleted:     boolean;
  readBy:      string[];
  deliveredTo: string[];
  createdAt:   any;
  reactions?:  Record<string, string[]>;
  pinned?:     boolean;
  forwardedFrom?: string;
  senderInfo?: User;
}

export interface Chat {
  id:            string;
  participants:  string[];
  lastMessage?:  Message;
  lastActivity:  any;
  unreadCount:   Record<string, number>;
  createdAt:     any;
}

export interface Room {
  id:          string;
  name:        string;
  description: string;
  avatar:      string;
  creatorId:   string;
  admins:      string[];
  members:     string[];
  bannedUsers: string[];
  maxMembers:  number;
  createdAt:   any;
  lastMessage?: Message;
  lastActivity: any;
  isPublic:    boolean;
  memberCount: number;
}

export interface Notification {
  id:        string;
  userId:    string;
  type:      'message' | 'friend_request' | 'room_invite' | 'mention';
  title:     string;
  body:      string;
  read:      boolean;
  data:      Record<string, any>;
  createdAt: any;
}
