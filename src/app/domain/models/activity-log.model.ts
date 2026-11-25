export interface ActivityLog {
  id: string;
  userId: string;
  username?: string | null;
  userAvatarUrl?: string | null;
  entityType: string;
  entityId: string;
  actionType: string;
  detailsJson?: string | null;
  createdAt: string;
}
