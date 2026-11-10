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
