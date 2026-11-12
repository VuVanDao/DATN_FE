export type UserNotificationType =
  | 'WorkspaceInvite'
  | 'ProjectInvite'
  | 'CardAssigned'
  | 'CommentMention'
  | 'DueDateReminder'
  | 'SprintStarted'
  | 'SystemAlert';

export interface UserNotification {
  id: string;
  receiverId: string;
  senderId: string | null;
  senderName: string | null;
  senderAvatarUrl: string | null;
  title: string;
  content: string;
  type: UserNotificationType | string;
  entityType: string | null;
  entityId: string | null;
  targetUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface UserNotificationList {
  unreadCount: number;
  totalCount: number;
  hasMore: boolean;
  items: UserNotification[];
}
