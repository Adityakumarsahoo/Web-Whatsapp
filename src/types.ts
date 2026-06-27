export interface User {
  id: string;
  phoneNumber: string;
  name: string;
  avatar: string;
  bio: string;
  online: boolean;
  lastSeen: string; // ISO String
  privacySettings: {
    lastSeen: 'everyone' | 'contacts' | 'nobody';
    profilePhoto: 'everyone' | 'contacts' | 'nobody';
    about: 'everyone' | 'contacts' | 'nobody';
    readReceipts: boolean;
  };
  blockedUsers: string[]; // List of user IDs
  isSuspended?: boolean;
  role: 'admin' | 'user';
  createdAt: string;
}

export type MessageStatus = 'sent' | 'delivered' | 'seen';
export type MediaType = 'image' | 'video' | 'audio' | 'voice' | 'document' | 'sticker';

export interface MessageReaction {
  userId: string;
  emoji: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string; // Ciphertext if encrypted, plain otherwise
  isEncrypted: boolean;
  mediaUrl?: string;
  mediaType?: MediaType;
  mediaName?: string;
  mediaSize?: number;
  status: MessageStatus;
  replyToId?: string; // ID of message being replied to
  reactions: MessageReaction[];
  isStarred?: boolean;
  isPinned?: boolean;
  isDeletedForAll?: boolean;
  createdAt: string;
}

export interface Chat {
  id: string;
  isGroup: boolean;
  name?: string; // Group name or undefined for 1-to-1 (fallback to recipient name)
  avatar?: string; // Group avatar or undefined for 1-to-1
  description?: string;
  members: string[]; // User IDs
  adminIds?: string[]; // Admin IDs for groups
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: string;
  };
  unreadCounts: { [userId: string]: number };
  archivedBy: string[]; // User IDs who archived this chat
  pinnedBy: string[]; // User IDs who pinned this chat
  createdAt: string;
}

export interface Status {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'photo' | 'video' | 'text';
  content: string; // Text content or media URL
  caption?: string;
  backgroundColor?: string; // For text-based status
  createdAt: string;
  viewers: string[]; // User IDs who saw this status
  likes: { userId: string; createdAt: string }[];
}

export interface Call {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  type: 'voice' | 'video';
  status: 'ringing' | 'connected' | 'missed' | 'ended' | 'rejected';
  duration?: number; // seconds
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: string;
  createdAt: string;
  status: 'pending' | 'resolved';
}

export interface Sticker {
  id: string;
  url: string;
  category: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'call' | 'group' | 'status';
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
}
