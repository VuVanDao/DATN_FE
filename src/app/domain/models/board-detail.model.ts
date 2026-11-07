import { SprintSummary } from './sprint.model';

export interface CardSummary {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  coverUrl?: string | null;
  type: number | string; // Task, Bug, Story, Epic
  priority: number | string; // Low, Medium, High, Urgent
  storyPoints?: number | null;
  startDate?: string | null;
  dueDate?: string | null;
  progressPercentage: number;
  columnId: string;
  assigneeId?: string | null;
  assigneeName?: string | null;
  assigneeAvatarUrl?: string | null;
  reporterId: string;
  reporterName: string;
  reporterAvatarUrl?: string | null;
  sprintId?: string | null;
  createdAt: string;
  commentsCount: number;
}

export interface CardComment {
  id: string;
  cardId: string;
  userId: string;
  username: string;
  userAvatarUrl?: string | null;
  contentText: string;
  createdAt: string;
}

export interface CardDetail extends CardSummary {
  comments: CardComment[];
}

export interface ColumnSummary {
  id: string;
  title: string;
  position: number;
  isDoneColumn: boolean;
  boardId: string;
  cards: CardSummary[];
}

export interface BoardDetail {
  id: string;
  title: string;
  slug: string;
  type: string;
  projectId: string;
  projectName: string;
  projectKey?: string | null;
  workspaceId?: string | null;
  isPinned: boolean;
  activeSprint?: SprintSummary | null;
  columns: ColumnSummary[];
}

export interface CreateColumnRequest {
  title: string;
  isDoneColumn?: boolean;
}

export interface UpdateColumnRequest {
  title: string;
  isDoneColumn: boolean;
}

export interface ReorderColumnsRequest {
  orderedColumnIds: string[];
}

export interface CreateCardRequest {
  columnId: string;
  title: string;
  description?: string;
  priority?: number;
  type?: number;
  assigneeId?: string;
  storyPoints?: number;
  dueDate?: string;
}

export interface MoveCardRequest {
  targetColumnId: string;
  newPosition: number;
}

export interface UpdateCardRequest {
  title?: string;
  description?: string | null;
  coverUrl?: string | null;
  coverImage?: File | null;
  type?: number | string;
  priority?: number | string;
  assigneeId?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  storyPoints?: number | null;
  progressPercentage?: number;
}
