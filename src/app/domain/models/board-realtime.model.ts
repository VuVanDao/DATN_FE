import { CardSummary } from './board-detail.model';
import { SprintSummary } from './sprint.model';

export interface ColumnsReorderedMessage {
  boardId: string;
  orderedColumnIds: string[];
  changedByUserId: string;
  occurredAt: string;
}

export interface CardMovedMessage {
  boardId: string;
  cardId: string;
  sourceColumnId: string;
  targetColumnId: string;
  newPosition: number;
  progressPercentage?: number;
  changedByUserId: string | null;
  occurredAt: string;
}

export interface ColumnCreatedMessage {
  boardId: string;
  columnId: string;
  title: string;
  position: number;
  isDoneColumn: boolean;
  changedByUserId: string;
  occurredAt: string;
}

export interface ColumnUpdatedMessage {
  boardId: string;
  columnId: string;
  title: string;
  position: number;
  isDoneColumn: boolean;
  changedByUserId: string;
  occurredAt: string;
}

export interface ColumnDeletedMessage {
  boardId: string;
  columnId: string;
  changedByUserId: string;
  occurredAt: string;
}

export interface CardCreatedMessage {
  boardId: string;
  card: CardSummary;
  changedByUserId: string;
  occurredAt: string;
}

export interface CardUpdatedMessage {
  boardId: string;
  card: CardSummary;
  changedByUserId: string;
  occurredAt: string;
}

export interface CardDeletedMessage {
  boardId: string;
  cardId: string;
  columnId: string;
  changedByUserId: string;
  occurredAt: string;
}

export interface SprintCreatedMessage {
  boardId: string;
  sprint: SprintSummary;
  changedByUserId: string;
  occurredAt: string;
}

export interface SprintStartedMessage {
  boardId: string;
  sprint: SprintSummary;
  changedByUserId: string;
  occurredAt: string;
}

export interface SprintUpdatedMessage {
  boardId: string;
  sprint: SprintSummary;
  changedByUserId: string;
  occurredAt: string;
}

export interface SprintCompletedMessage {
  boardId: string;
  sprintId: string;
  changedByUserId: string;
  occurredAt: string;
}

export interface SprintDeletedMessage {
  boardId: string;
  sprintId: string;
  changedByUserId: string;
  occurredAt: string;
}

export interface CardSprintChangedMessage {
  boardId: string;
  card: CardSummary;
  oldSprintId: string | null;
  newSprintId: string | null;
  changedByUserId: string;
  occurredAt: string;
}

export interface CardDependencyAddedMessage {
  boardId: string;
  dependencyId: string;
  blockedCardId: string;
  blockingCardId: string;
  changedByUserId: string;
  occurredAt: string;
}

export interface CardDependencyRemovedMessage {
  boardId: string;
  dependencyId: string;
  blockedCardId: string;
  blockingCardId: string;
  changedByUserId: string;
  occurredAt: string;
}
