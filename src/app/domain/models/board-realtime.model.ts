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
