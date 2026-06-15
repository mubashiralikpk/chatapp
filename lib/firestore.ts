import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, arrayUnion, arrayRemove,
  increment, writeBatch, Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { Chat, Message, Room, FriendRequest, Notification } from '@/types';

// ════════════════════════════════════════════════════════
//  FRIENDS SYSTEM
// ════════════════════════════════════════════════════════

export async function sendFriendRequest(fromUid: string, toUid: string) {
  // Check if request already exists
  const q = query(
    collection(db, 'friendRequests'),
    where('fromUid', '==', fromUid),
    where('toUid',   '==', toUid),
    where('status',  '==', 'pending')
  );
  const existing = await getDocs(q);
  if (!existing.empty) throw new Error('Friend request already sent.');

  const ref = await addDoc(collection(db, 'friendRequests'), {
    fromUid,
    toUid,
    status:    'pending',
    createdAt: serverTimestamp(),
  });

  // Create notification
  await createNotification(toUid, {
    type:  'friend_request',
    title: 'New Friend Request',
    body:  'Someone sent you a friend request',
    data:  { requestId: ref.id, fromUid },
  });

  return ref.id;
}

export async function acceptFriendRequest(requestId: string, uid1: string, uid2: string) {
  const batch = writeBatch(db);

  // Update request status
  batch.update(doc(db, 'friendRequests', requestId), { status: 'accepted' });

  // Add to both users' contacts
  batch.update(doc(db, 'users', uid1), { contacts: arrayUnion(uid2) });
  batch.update(doc(db, 'users', uid2), { contacts: arrayUnion(uid1) });

  await batch.commit();
}

export async function rejectFriendRequest(requestId: string) {
  await updateDoc(doc(db, 'friendRequests', requestId), { status: 'rejected' });
}

export async function cancelFriendRequest(requestId: string) {
  await deleteDoc(doc(db, 'friendRequests', requestId));
}

export async function removeContact(uid1: string, uid2: string) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', uid1), { contacts: arrayRemove(uid2) });
  batch.update(doc(db, 'users', uid2), { contacts: arrayRemove(uid1) });
  await batch.commit();
}

export function subscribeToFriendRequests(
  uid: string,
  cb: (requests: FriendRequest[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'friendRequests'),
    where('toUid', '==', uid),
    where('status', '==', 'pending')
  );
  return onSnapshot(q, snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest)))
  );
}

// ════════════════════════════════════════════════════════
//  PRIVATE CHATS
// ════════════════════════════════════════════════════════

export async function getOrCreateChat(uid1: string, uid2: string): Promise<string> {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', uid1)
  );
  const snap = await getDocs(q);
  const existing = snap.docs.find(d =>
    d.data().participants.includes(uid2)
  );
  if (existing) return existing.id;

  const ref = await addDoc(collection(db, 'chats'), {
    participants:  [uid1, uid2],
    lastActivity:  serverTimestamp(),
    unreadCount:   { [uid1]: 0, [uid2]: 0 },
    createdAt:     serverTimestamp(),
  });
  return ref.id;
}

export function subscribeToChats(
  uid: string,
  cb: (chats: Chat[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', uid),
    orderBy('lastActivity', 'desc')
  );
  return onSnapshot(q, snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Chat)))
  );
}

// ════════════════════════════════════════════════════════
//  MESSAGES
// ════════════════════════════════════════════════════════

export async function sendMessage(
  chatId: string,
  senderId: string,
  content: string,
  type: Message['type'] = 'text',
  extra: Partial<Message> = {}
) {
  const msgRef = await addDoc(
    collection(db, 'chats', chatId, 'messages'),
    {
      chatId,
      senderId,
      content,
      type,
      edited:      false,
      deleted:     false,
      readBy:      [senderId],
      deliveredTo: [senderId],
      createdAt:   serverTimestamp(),
      ...extra,
    }
  );

  // Update chat's last message
  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage:  { id: msgRef.id, content, senderId, type, createdAt: serverTimestamp() },
    lastActivity: serverTimestamp(),
  });

  return msgRef.id;
}

export async function editMessage(chatId: string, msgId: string, newContent: string) {
  await updateDoc(doc(db, 'chats', chatId, 'messages', msgId), {
    content: newContent,
    edited:  true,
  });
}

export async function deleteMessage(chatId: string, msgId: string) {
  await updateDoc(doc(db, 'chats', chatId, 'messages', msgId), {
    deleted: true,
    content: 'This message was deleted',
  });
}

export async function markMessagesRead(chatId: string, uid: string) {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    where('readBy', 'not-in', [[uid]])
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(d => {
    if (!d.data().readBy?.includes(uid)) {
      batch.update(d.ref, { readBy: arrayUnion(uid) });
    }
  });
  await batch.commit();

  // Reset unread count
  await updateDoc(doc(db, 'chats', chatId), {
    [`unreadCount.${uid}`]: 0,
  });
}

export async function pinMessage(chatId: string, msgId: string, pinned: boolean) {
  await updateDoc(doc(db, 'chats', chatId, 'messages', msgId), { pinned });
}

export async function addReaction(
  chatId: string, msgId: string, uid: string, emoji: string
) {
  await updateDoc(doc(db, 'chats', chatId, 'messages', msgId), {
    [`reactions.${emoji}`]: arrayUnion(uid),
  });
}

export function subscribeToMessages(
  chatId: string,
  cb: (messages: Message[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(100)
  );
  return onSnapshot(q, snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)))
  );
}

export async function setTyping(chatId: string, uid: string, isTyping: boolean) {
  await updateDoc(doc(db, 'chats', chatId), {
    [`typing.${uid}`]: isTyping,
  });
}

// ════════════════════════════════════════════════════════
//  ROOMS
// ════════════════════════════════════════════════════════

export async function createRoom(
  creatorId: string,
  name: string,
  description: string,
  avatar: string,
  isPublic: boolean
): Promise<string> {
  const ref = await addDoc(collection(db, 'rooms'), {
    name,
    description,
    avatar:       avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`,
    creatorId,
    admins:       [creatorId],
    members:      [creatorId],
    bannedUsers:  [],
    maxMembers:   25,
    isPublic,
    memberCount:  1,
    lastActivity: serverTimestamp(),
    createdAt:    serverTimestamp(),
  });
  return ref.id;
}

export async function joinRoom(roomId: string, uid: string) {
  const roomDoc = await getDoc(doc(db, 'rooms', roomId));
  if (!roomDoc.exists()) throw new Error('Room not found.');
  const room = roomDoc.data() as Room;

  if (room.bannedUsers.includes(uid)) throw new Error('You are banned from this room.');
  if (room.members.length >= room.maxMembers) throw new Error('Room is full (max 25 members).');

  await updateDoc(doc(db, 'rooms', roomId), {
    members:     arrayUnion(uid),
    memberCount: increment(1),
  });
}

export async function leaveRoom(roomId: string, uid: string) {
  await updateDoc(doc(db, 'rooms', roomId), {
    members:     arrayRemove(uid),
    admins:      arrayRemove(uid),
    memberCount: increment(-1),
  });
}

export async function kickMember(roomId: string, uid: string) {
  await updateDoc(doc(db, 'rooms', roomId), {
    members:     arrayRemove(uid),
    admins:      arrayRemove(uid),
    memberCount: increment(-1),
  });
}

export async function banUser(roomId: string, uid: string) {
  await updateDoc(doc(db, 'rooms', roomId), {
    members:     arrayRemove(uid),
    admins:      arrayRemove(uid),
    bannedUsers: arrayUnion(uid),
    memberCount: increment(-1),
  });
}

export async function unbanUser(roomId: string, uid: string) {
  await updateDoc(doc(db, 'rooms', roomId), {
    bannedUsers: arrayRemove(uid),
  });
}

export async function promoteToAdmin(roomId: string, uid: string) {
  await updateDoc(doc(db, 'rooms', roomId), { admins: arrayUnion(uid) });
}

export async function demoteAdmin(roomId: string, uid: string) {
  await updateDoc(doc(db, 'rooms', roomId), { admins: arrayRemove(uid) });
}

export async function deleteRoom(roomId: string) {
  await deleteDoc(doc(db, 'rooms', roomId));
}

export async function sendRoomMessage(
  roomId: string,
  senderId: string,
  content: string,
  type: Message['type'] = 'text',
  extra: Partial<Message> = {}
) {
  const ref = await addDoc(
    collection(db, 'rooms', roomId, 'messages'),
    {
      roomId,
      senderId,
      content,
      type,
      edited:    false,
      deleted:   false,
      readBy:    [senderId],
      createdAt: serverTimestamp(),
      ...extra,
    }
  );

  await updateDoc(doc(db, 'rooms', roomId), {
    lastMessage:  { id: ref.id, content, senderId, type, createdAt: serverTimestamp() },
    lastActivity: serverTimestamp(),
  });

  return ref.id;
}

export function subscribeToRoomMessages(
  roomId: string,
  cb: (messages: Message[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'rooms', roomId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(100)
  );
  return onSnapshot(q, snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)))
  );
}

export function subscribeToRooms(
  uid: string,
  cb: (rooms: Room[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'rooms'),
    where('members', 'array-contains', uid),
    orderBy('lastActivity', 'desc')
  );
  return onSnapshot(q, snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Room)))
  );
}

export async function searchPublicRooms(searchTerm: string): Promise<Room[]> {
  const q = query(
    collection(db, 'rooms'),
    where('isPublic', '==', true),
    orderBy('memberCount', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);
  const rooms = snap.docs.map(d => ({ id: d.id, ...d.data() } as Room));
  return rooms.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

// ════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ════════════════════════════════════════════════════════

export async function createNotification(
  userId: string,
  data: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>
) {
  await addDoc(collection(db, 'notifications'), {
    userId,
    ...data,
    read:      false,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToNotifications(
  uid: string,
  cb: (notifications: Notification[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', uid),
    where('read',   '==', false),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)))
  );
}

export async function markNotificationRead(notifId: string) {
  await updateDoc(doc(db, 'notifications', notifId), { read: true });
}

// ── Block user ─────────────────────────────────────────────
export async function blockUser(uid: string, targetUid: string) {
  await updateDoc(doc(db, 'users', uid), {
    blockedUsers: arrayUnion(targetUid),
  });
}

export async function unblockUser(uid: string, targetUid: string) {
  await updateDoc(doc(db, 'users', uid), {
    blockedUsers: arrayRemove(targetUid),
  });
}
