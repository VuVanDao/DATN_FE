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
  sprintId?: string | null;
  createdAt: string;
  commentsCount: number;
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
  columns: ColumnSummary[];
}

export interface CreateColumnRequest {
  title: string;
  isDoneColumn?: boolean;
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
