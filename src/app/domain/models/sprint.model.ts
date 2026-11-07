import { CardSummary } from './board-detail.model';

export type SprintStatus = 'Future' | 'Active' | 'Closed';

export interface SprintSummary {
  id: string;
  projectId: string;
  name: string;
  goal?: string | null;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  createdAt: string;
  totalCards: number;
  completedCards: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  cards?: CardSummary[];
}

export interface ProjectBacklog {
  projectId: string;
  activeSprint?: SprintSummary | null;
  futureSprints: SprintSummary[];
  backlogCards: CardSummary[];
  backlogTotalCards: number;
  backlogTotalStoryPoints: number;
}

export interface CreateSprintRequest {
  projectId: string;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateSprintRequest {
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

export interface StartSprintRequest {
  startDate?: string;
  endDate?: string;
  goal?: string;
}

export interface CompleteSprintRequest {
  moveUnfinishedToSprintId?: string | null;
}

export interface MoveCardToSprintRequest {
  cardId: string;
  sprintId?: string | null;
}
