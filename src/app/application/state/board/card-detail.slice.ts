import { inject, Injectable, signal } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import {
  CardComment,
  CardDetail,
  CardSummary,
  UpdateCardRequest,
} from '../../../domain/models/board-detail.model';
import { AddCardCommentUseCase } from '../../board/add-card-comment.use-case';
import { GetCardDetailUseCase } from '../../board/get-card-detail.use-case';
import { UpdateCardUseCase } from '../../board/update-card.use-case';
import { NotificationService } from '../../shared/notification.service';
import { BoardColumnsSlice } from './board-columns.slice';
import { BoardDetailSlice } from './board-detail.slice';

@Injectable({
  providedIn: 'root',
})
export class CardDetailSlice {
  private readonly getCardDetailUseCase = inject(GetCardDetailUseCase);
  private readonly addCardCommentUseCase = inject(AddCardCommentUseCase);
  private readonly updateCardUseCase = inject(UpdateCardUseCase);
  private readonly boardColumns = inject(BoardColumnsSlice);
  private readonly boardDetail = inject(BoardDetailSlice);
  private readonly notifications = inject(NotificationService);

  private readonly cancel$ = new Subject<void>();
  private readonly processedCommentIds = new Set<string>();

  private readonly cardDetailSignal = signal<CardDetail | null>(null);
  private readonly isLoadingCardDetailSignal = signal<boolean>(false);

  readonly currentCardDetail = this.cardDetailSignal.asReadonly();
  readonly isLoadingCardDetail = this.isLoadingCardDetailSignal.asReadonly();

  loadCardDetail(cardId: string, onError?: (err: string) => void): void {
    this.isLoadingCardDetailSignal.set(true);
    this.getCardDetailUseCase
      .execute(cardId)
      .pipe(takeUntil(this.cancel$))
      .subscribe({
        next: (detail) => {
          this.cardDetailSignal.set(detail);
          this.isLoadingCardDetailSignal.set(false);

          // Đồng bộ các thuộc tính phụ thuộc (isBlocked, blockedByCount, tiến độ) vào columnsSignal
          this.boardColumns.updateColumnsLocally((cols) =>
            cols.map((col) => ({
              ...col,
              cards: col.cards.map((c) =>
                c.id.toLowerCase() === detail.id.toLowerCase()
                  ? {
                      ...c,
                      title: detail.title,
                      description: detail.description,
                      priority: detail.priority,
                      type: detail.type,
                      coverUrl: detail.coverUrl,
                      storyPoints: detail.storyPoints,
                      startDate: detail.startDate,
                      dueDate: detail.dueDate,
                      isCompleted: detail.isCompleted,
                      assigneeId: detail.assigneeId,
                      assigneeName: detail.assigneeName,
                      assigneeAvatarUrl: detail.assigneeAvatarUrl,
                      isBlocked: detail.isBlocked,
                      blockedByCount: detail.blockedByCount,
                    }
                  : c,
              ),
            })),
          );
        },
        error: (err) => {
          this.isLoadingCardDetailSignal.set(false);
          this.notifications.error('Không thể tải chi tiết thẻ.');
          onError?.(err?.message || 'Lỗi tải chi tiết thẻ');
        },
      });
  }

  clearCardDetail(): void {
    this.cardDetailSignal.set(null);
    this.isLoadingCardDetailSignal.set(false);
  }

  clearIfActive(cardId: string): void {
    if (this.cardDetailSignal()?.id?.toLowerCase() === cardId.toLowerCase()) {
      this.clearCardDetail();
    }
  }

  setCardDetailLocally(detail: CardDetail | null): void {
    this.cardDetailSignal.set(detail);
  }

  updateActiveCardLocally(updater: (detail: CardDetail | null) => CardDetail | null): void {
    this.cardDetailSignal.update(updater);
  }

  updateCard(
    cardId: string,
    updates: Partial<UpdateCardRequest> & {
      assigneeName?: string | null;
      assigneeAvatarUrl?: string | null;
    },
    onSuccess?: (updated: CardSummary) => void,
    onError?: (err: string) => void,
    silent = false,
    onStatusChanged?: () => void,
  ): void {
    let currentCard: CardSummary | null = null;
    for (const col of this.boardColumns.columns()) {
      const found = col.cards.find((c) => c.id === cardId);
      if (found) {
        currentCard = found;
        break;
      }
    }
    if (!currentCard) {
      currentCard = this.cardDetailSignal();
    }
    if (!currentCard) return;

    const previousCols = this.boardColumns.columns();
    const previousDetail = this.cardDetailSignal();
    const previousBoard = this.boardDetail.currentBoard();

    const fullRequest: UpdateCardRequest = {
      title: updates.title !== undefined ? updates.title : currentCard.title,
      description:
        updates.description !== undefined ? updates.description : currentCard.description,
      coverUrl: updates.coverUrl !== undefined ? updates.coverUrl : currentCard.coverUrl,
      coverImage: updates.coverImage !== undefined ? updates.coverImage : null,
      type: updates.type !== undefined ? updates.type : currentCard.type,
      priority: updates.priority !== undefined ? updates.priority : currentCard.priority,
      assigneeId: updates.assigneeId !== undefined ? updates.assigneeId : currentCard.assigneeId,
      startDate: updates.startDate !== undefined ? updates.startDate : currentCard.startDate,
      dueDate: updates.dueDate !== undefined ? updates.dueDate : currentCard.dueDate,
      storyPoints:
        updates.storyPoints !== undefined ? updates.storyPoints : currentCard.storyPoints,
      isCompleted:
        updates.isCompleted !== undefined
          ? updates.isCompleted
          : currentCard.isCompleted,
    };

    // Optimistic update
    const oldIsCompleted = !!currentCard.isCompleted;
    const newIsCompleted =
      updates.isCompleted !== undefined
        ? !!updates.isCompleted
        : oldIsCompleted;

    const oldPts = currentCard.storyPoints || 0;
    const newPts =
      updates.storyPoints !== undefined ? (updates.storyPoints || 0) : oldPts;
    const diffPts = newPts - oldPts;

    const completing = !oldIsCompleted && newIsCompleted;
    const uncompleting = oldIsCompleted && !newIsCompleted;

    if (completing || uncompleting || diffPts !== 0) {
      this.boardDetail.updateBoardLocally((b) => {
        if (!b?.activeSprint) return b;
        let compCards = b.activeSprint.completedCards || 0;
        let compPts = b.activeSprint.completedStoryPoints || 0;
        let totPts = b.activeSprint.totalStoryPoints || 0;

        if (completing) {
          compCards += 1;
          compPts += newPts;
        } else if (uncompleting) {
          compCards = Math.max(0, compCards - 1);
          compPts = Math.max(0, compPts - oldPts);
        } else if (diffPts !== 0 && oldIsCompleted) {
          compPts = Math.max(0, compPts + diffPts);
        }

        if (diffPts !== 0) {
          totPts = Math.max(0, totPts + diffPts);
        }

        return {
          ...b,
          activeSprint: {
            ...b.activeSprint,
            completedCards: compCards,
            completedStoryPoints: compPts,
            totalStoryPoints: totPts,
          },
        };
      });
    }

    // Optimistic update: nếu thẻ này đang chặn các thẻ khác, cập nhật ngay trạng thái isBlocked của các thẻ đó trên bảng
    const currentDetail = this.cardDetailSignal();
    const isTargetingCurrentDetail =
      currentDetail && currentDetail.id.toLowerCase() === cardId.toLowerCase();
    const blockingList = isTargetingCurrentDetail ? currentDetail?.blocking || [] : [];
    const blockingCardIds = new Set(blockingList.map((b) => b.cardId.toLowerCase()));

    this.boardColumns.updateColumnsLocally((cols) =>
      cols.map((col) => ({
        ...col,
        cards: col.cards.map((c) => {
          if (c.id === cardId) {
            return { ...c, ...updates };
          }
          if (uncompleting && blockingCardIds.has(c.id.toLowerCase())) {
            return {
              ...c,
              isBlocked: true,
              blockedByCount: Math.max(1, (c.blockedByCount || 0) + 1),
            };
          }
          if (completing && blockingCardIds.has(c.id.toLowerCase())) {
            const newCount = Math.max(0, (c.blockedByCount || 1) - 1);
            return {
              ...c,
              isBlocked: newCount > 0,
              blockedByCount: newCount,
            };
          }
          return c;
        }),
      })),
    );

    if (this.cardDetailSignal()?.id === cardId) {
      this.cardDetailSignal.update((d) => (d ? { ...d, ...updates } : null));
    }

    this.updateCardUseCase
      .execute(cardId, fullRequest)
      .pipe(takeUntil(this.cancel$))
      .subscribe({
        next: (updatedCard) => {
          this.boardColumns.updateColumnsLocally((cols) =>
            cols.map((col) => ({
              ...col,
              cards: col.cards.map((c) => (c.id === cardId ? { ...c, ...updatedCard } : c)),
            })),
          );
          if (this.cardDetailSignal()?.id === cardId) {
            this.cardDetailSignal.update((d) => (d ? { ...d, ...updatedCard } : null));
          }
          if (!silent) {
            this.notifications.success('Đã lưu thông tin thẻ thành công');
          }
          onSuccess?.(updatedCard);

          if (completing || uncompleting) {
            onStatusChanged?.();
          }
        },
        error: (err) => {
          this.boardColumns.setColumns(previousCols);
          this.cardDetailSignal.set(previousDetail);
          this.boardDetail.setBoard(previousBoard);
          this.notifications.error('Không thể cập nhật thông tin thẻ.');
          onError?.(err?.message || 'Lỗi cập nhật thẻ');
        },
      });
  }

  addCardComment(
    cardId: string,
    contentText: string,
    onSuccess?: (comment: CardComment) => void,
  ): void {
    const trimmed = contentText.trim();
    if (!trimmed) return;

    this.addCardCommentUseCase
      .execute(cardId, trimmed)
      .pipe(takeUntil(this.cancel$))
      .subscribe({
        next: (newComment) => {
          this.applyIncomingCardComment(newComment);
          this.notifications.success('Đã gửi bình luận');
          onSuccess?.(newComment);
        },
        error: () => {
          this.notifications.error('Không thể gửi bình luận. Vui lòng thử lại.');
        },
      });
  }

  applyIncomingCardComment(comment: CardComment): boolean {
    const normalizedCommentId = comment.id.toLowerCase();
    if (this.processedCommentIds.has(normalizedCommentId)) {
      return false;
    }
    this.processedCommentIds.add(normalizedCommentId);

    const targetCardIdLower = comment.cardId.toLowerCase();

    if (this.cardDetailSignal()?.id.toLowerCase() === targetCardIdLower) {
      this.cardDetailSignal.update((d) => {
        if (!d) return null;
        const exists = (d.comments || []).some(
          (c) => c.id.toLowerCase() === normalizedCommentId,
        );
        if (exists) return d;
        return {
          ...d,
          comments: [comment, ...(d.comments || [])],
          commentsCount: (d.commentsCount || 0) + 1,
        };
      });
    }

    this.boardColumns.updateColumnsLocally((cols) =>
      cols.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id.toLowerCase() === targetCardIdLower
            ? { ...c, commentsCount: (c.commentsCount || 0) + 1 }
            : c,
        ),
      })),
    );

    this.boardDetail.updateBoardLocally((b) =>
      b
        ? {
            ...b,
            columns: (b.columns || []).map((col) => ({
              ...col,
              cards: (col.cards || []).map((c) =>
                c.id.toLowerCase() === targetCardIdLower
                  ? { ...c, commentsCount: (c.commentsCount || 0) + 1 }
                  : c,
              ),
            })),
          }
        : null,
    );

    return true;
  }

  clear(): void {
    this.cancel$.next();
    this.cardDetailSignal.set(null);
    this.isLoadingCardDetailSignal.set(false);
    this.processedCommentIds.clear();
  }
}
