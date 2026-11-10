import { CardSummary } from './board-detail.model';

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
