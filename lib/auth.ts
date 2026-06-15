import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  sendEmailVerification,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, query,
  collection, where, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '@/types';

// ── Check username uniqueness ──────────────────────────────
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const q = query(
    collection(db, 'users'),
    where('username', '==', username.toLowerCase())
  );
  const snap = await getDocs(q);
  return snap.empty;
}

// ── Register ───────────────────────────────────────────────
export async function registerUser(
  email: string,
  password: string,
  username: string,
  name: string
) {
  // 1. Check username
  const available = await isUsernameAvailable(username);
  if (!available) throw new Error('Username already taken.');

  // 2. Create Firebase Auth user
  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  // 3. Send email verification
  await sendEmailVerification(user);

  // 4. Save user profile to Firestore
  const userData: User = {
    uid:          user.uid,
    username:     username.toLowerCase(),
    name,
    email,
    avatar:       `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    status:       'online',
    lastSeen:     serverTimestamp(),
    createdAt:    serverTimestamp(),
    blockedUsers: [],
  };

  await setDoc(doc(db, 'users', user.uid), userData);

  // 5. Reserve username in separate collection (for fast lookup)
  await setDoc(doc(db, 'usernames', username.toLowerCase()), {
    uid: user.uid,
  });

  return user;
}

// ── Login ──────────────────────────────────────────────────
export async function loginUser(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

// ── Logout ─────────────────────────────────────────────────
export async function logoutUser() {
  return signOut(auth);
}

// ── Password Reset ─────────────────────────────────────────
export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

// ── Update Profile ─────────────────────────────────────────
export async function updateUserEmail(
  currentPassword: string,
  newEmail: string
) {
  const user = auth.currentUser!;
  const cred = EmailAuthProvider.credential(user.email!, currentPassword);
  await reauthenticateWithCredential(user, cred);
  await updateEmail(user, newEmail);
}

export async function updateUserPassword(
  currentPassword: string,
  newPassword: string
) {
  const user = auth.currentUser!;
  const cred = EmailAuthProvider.credential(user.email!, currentPassword);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPassword);
}

// ── Get user by username ───────────────────────────────────
export async function getUserByUsername(username: string): Promise<User | null> {
  const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
  if (!usernameDoc.exists()) return null;
  const uid = usernameDoc.data().uid;
  const userDoc = await getDoc(doc(db, 'users', uid));
  return userDoc.exists() ? (userDoc.data() as User) : null;
}
