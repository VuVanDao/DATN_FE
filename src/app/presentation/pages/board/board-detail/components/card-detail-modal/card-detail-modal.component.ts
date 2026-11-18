import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  OnInit,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SessionService } from '../../../../../../application/auth/session.service';
import { GetCardActivitiesUseCase } from '../../../../../../application/board/get-card-activities.use-case';
import { NotificationService } from '../../../../../../application/shared/notification.service';
import { ActivityLog } from '../../../../../../domain/models/activity-log.model';
import {
  CardDependencyItem,
  CardDetail,
  CardSummary,
  ColumnSummary,
} from '../../../../../../domain/models/board-detail.model';
import { ProjectMember } from '../../../../../../domain/models/project.model';
import { CardActionChipsComponent } from './card-action-chips/card-action-chips.component';
import { CardActivityFeedComponent } from './card-activity-feed/card-activity-feed.component';
import { CardDependenciesComponent } from './card-dependencies/card-dependencies.component';
import { CardDescriptionComponent } from './card-description/card-description.component';
import { CardDetailHeaderComponent } from './card-detail-header/card-detail-header.component';
import {
  CardDetailActivity,
  PriorityOption,
  PriorityType,
  WorkType,
  WorkTypeOption,
} from './card-detail.types';

export type { PriorityType, WorkType, PriorityOption, WorkTypeOption, CardDetailActivity };

@Component({
  selector: 'app-card-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    CardDetailHeaderComponent,
    CardActionChipsComponent,
    CardDescriptionComponent,
    CardDependenciesComponent,
    CardActivityFeedComponent,
  ],
  templateUrl: './card-detail-modal.component.html',
})
export class CardDetailModalComponent implements OnInit {
  private readonly sessionService = inject(SessionService);
  private readonly notificationService = inject(NotificationService);
  private readonly getCardActivitiesUseCase = inject(GetCardActivitiesUseCase);

  // Inputs
  readonly isOpen = input<boolean>(false);
  readonly card = input.required<CardSummary>();
  readonly cardDetail = input<CardDetail | null>(null);
  readonly isLoading = input<boolean>(false);
  readonly isLoadingActivities = signal<boolean>(false);
  readonly columns = input<ColumnSummary[]>([]);
  readonly members = input<ProjectMember[]>([]);

  // Outputs (All action events for logging / future API integration)
  readonly closed = output<void>();
  readonly columnChanged = output<{ cardId: string; columnId: string; columnTitle: string }>();
  readonly titleChanged = output<{ cardId: string; title: string }>();
  readonly descriptionChanged = output<{ cardId: string; description: string }>();
  readonly coverChanged = output<{ cardId: string; coverUrl: string | null; file?: File | null }>();
  readonly commentAdded = output<{ cardId: string; content: string }>();
  readonly priorityChanged = output<{ cardId: string; priority: PriorityType }>();
  readonly typeChanged = output<{ cardId: string; type: WorkType }>();
  readonly datesChanged = output<{
    cardId: string;
    startDate: string | null;
    dueDate: string | null;
  }>();
  readonly assigneeChanged = output<{
    cardId: string;
    assigneeId: string | null;
    assigneeName: string | null;
  }>();
  readonly completionChanged = output<{ cardId: string; isCompleted: boolean }>();
  readonly storyPointsChanged = output<{ cardId: string; storyPoints: number | null }>();
  readonly deleteCard = output<{ cardId: string; columnId: string }>();
  readonly cardNavigated = output<string>();
  readonly dependencyChanged = output<void>();

  // Element refs
  readonly titleInputRef = viewChild<ElementRef<HTMLTextAreaElement>>('titleInput');

  // Local Editable States
  readonly currentTitle = signal<string>('');
  readonly isEditingTitle = signal<boolean>(false);

  readonly currentDescription = signal<string>('');
  readonly currentCoverUrl = signal<string | null>(null);
  readonly currentColumnId = signal<string>('');

  readonly isCompleted = signal<boolean>(false);

  // Priority & Type States
  readonly currentPriority = signal<PriorityType>('Low');
  readonly currentType = signal<WorkType>('Task');

  // Dates States
  readonly currentStartDate = signal<string>('');
  readonly currentDueDate = signal<string>('');

  // Assignee & Reporter States
  readonly currentAssigneeId = signal<string | null>(null);
  readonly currentAssigneeName = signal<string | null>(null);
  readonly currentReporterName = signal<string>('');

  // Points State
  readonly currentStoryPoints = signal<number | null>(null);

  // User
  readonly currentUser = computed(() => this.sessionService.currentUser());
  readonly currentUserName = computed(() => {
    const u = this.currentUser();
    return u?.userName || 'Tôi';
  });
  readonly currentUserAvatar = computed(() => this.currentUser()?.avatarUrl ?? null);

  // Activity list
  readonly activities = signal<CardDetailActivity[]>([]);

  // Card Dependencies
  readonly blockedBy = signal<CardDependencyItem[]>([]);
  readonly blocking = signal<CardDependencyItem[]>([]);

  readonly unfinishedBlockers = computed(() => this.blockedBy().filter((d) => !d.isDone));

  readonly hasUnfinishedBlockersWhileCompleted = computed(
    () => this.isCompleted() && this.unfinishedBlockers().length > 0,
  );

  readonly unfinishedBlockerNames = computed(() =>
    this.unfinishedBlockers()
      .map((d) => `"${d.title}"`)
      .join(', '),
  );

  constructor() {
    effect(() => {
      const c = this.card();
      if (c) {
        untracked(() => {
          this.initCardData();
        });
      }
    });

    effect(() => {
      const detail = this.cardDetail();
      if (detail && detail.id === this.card().id) {
        untracked(() => {
          this.syncWithDetail(detail);
        });
      }
    });
  }

  ngOnInit(): void {
    this.initCardData();
  }

  private syncWithDetail(d: CardDetail): void {
    if (!this.isEditingTitle()) {
      this.currentTitle.set(d.title || '');
    }
    this.currentDescription.set(d.description || '');
    this.currentCoverUrl.set(d.coverUrl || null);
    this.currentColumnId.set(d.columnId || '');
    this.currentPriority.set(this.normalizePriority(d.priority));
    this.currentType.set(this.normalizeType(d.type));
    this.currentStartDate.set(this.formatDateForInput(d.startDate));
    this.currentDueDate.set(this.formatDateForInput(d.dueDate));
    this.currentAssigneeId.set(d.assigneeId || null);
    if (d.assigneeId) {
      const member = this.members().find((m) => m.userId === d.assigneeId);
      this.currentAssigneeName.set(
        d.assigneeName || member?.username || this.currentAssigneeName(),
      );
    } else {
      this.currentAssigneeName.set(null);
    }
    this.currentReporterName.set(d.reporterName || 'Thành viên');

    // Completion & Points
    this.isCompleted.set(!!d.isCompleted);
    this.currentStoryPoints.set(d.storyPoints ?? null);

    // Sync Dependencies
    this.blockedBy.set(d.blockedBy || []);
    this.blocking.set(d.blocking || []);

    // Load actual Activity Logs from backend API
    this.loadActivities(d.id);
  }

  private formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('vi-VN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  private initCardData(): void {
    const c = this.card();
    if (!c) return;

    if (!this.isEditingTitle()) {
      this.currentTitle.set(c.title || '');
    }
    this.currentDescription.set(c.description || '');
    this.currentCoverUrl.set(c.coverUrl || null);
    this.currentColumnId.set(c.columnId || '');

    // Map Priority & Type
    this.currentPriority.set(this.normalizePriority(c.priority));
    this.currentType.set(this.normalizeType(c.type));

    // Map Dates
    this.currentStartDate.set(this.formatDateForInput(c.startDate));
    this.currentDueDate.set(this.formatDateForInput(c.dueDate));

    // Map Assignee & Reporter
    this.currentAssigneeId.set(c.assigneeId || null);
    if (c.assigneeId) {
      const member = this.members().find((m) => m.userId === c.assigneeId);
      this.currentAssigneeName.set(c.assigneeName || member?.username || null);
    } else {
      this.currentAssigneeName.set(null);
    }
    this.currentReporterName.set(c.reporterName || 'Thành viên');

    // Completion & Points
    this.isCompleted.set(!!c.isCompleted);
    this.currentStoryPoints.set(c.storyPoints ?? null);

    // Dependencies
    const detail = this.cardDetail();
    if (detail && detail.id === c.id) {
      this.blockedBy.set(detail.blockedBy || []);
      this.blocking.set(detail.blocking || []);
    } else {
      this.blockedBy.set([]);
      this.blocking.set([]);
    }

    // Load Activity Logs
    this.loadActivities(c.id);
  }

  private loadActivities(cardId: string): void {
    if (!cardId) return;
    this.isLoadingActivities.set(true);
    this.getCardActivitiesUseCase.execute(cardId, 1, 50).subscribe({
      next: (paged) => {
        const mapped = (paged.items || []).map((log) => this.mapActivityLogToDetail(log));
        this.activities.set(mapped);
        this.isLoadingActivities.set(false);
      },
      error: () => {
        this.isLoadingActivities.set(false);
      },
    });
  }

  private mapActivityLogToDetail(log: ActivityLog): CardDetailActivity {
    let details: any = null;
    if (log.detailsJson) {
      try {
        details = JSON.parse(log.detailsJson);
      } catch {
        details = null;
      }
    }

    let actionText = 'đã cập nhật thẻ';
    let isComment = false;
    let commentContent: string | undefined;

    switch (log.actionType) {
      case 'Created':
        actionText = 'đã tạo thẻ này';
        break;
      case 'MovedColumn':
        if (details?.fromColumnTitle && details?.toColumnTitle) {
          actionText = `đã chuyển thẻ từ cột "${details.fromColumnTitle}" sang "${details.toColumnTitle}"`;
        } else {
          actionText = 'đã di chuyển thẻ sang cột khác';
        }
        break;
      case 'AssignedUser':
        actionText = `đã giao việc cho ${details?.assigneeName || 'thành viên'}`;
        break;
      case 'UnassignedUser':
        actionText = details?.previousAssigneeName
          ? `đã huỷ phân công cho ${details.previousAssigneeName}`
          : 'đã huỷ phân công công việc';
        break;
      case 'UpdatedDueDate':
        actionText = 'đã cập nhật hạn chót';
        break;
      case 'Commented':
        actionText = 'đã bình luận';
        isComment = true;
        commentContent = details?.preview || '';
        break;
      case 'Deleted':
        actionText = 'đã xoá thẻ';
        break;
      case 'Updated':
        if (details?.field === 'Type' || details?.newType) {
          actionText = `đã đổi loại công việc thành "${details.newType}"`;
        } else if (details?.field === 'StoryPoints' || details?.newStoryPoints !== undefined) {
          actionText =
            details.newStoryPoints !== null && details.newStoryPoints !== undefined
              ? `đã cập nhật điểm ước lượng thành ${details.newStoryPoints} pts`
              : 'đã gỡ điểm ước lượng';
        } else if (details?.field === 'Priority' || details?.newPriority || details?.priority) {
          actionText = `đã cập nhật độ ưu tiên thành "${details.newPriority || details.priority}"`;
        } else if (details?.field === 'IsCompleted' || details?.newIsCompleted !== undefined) {
          actionText = details.newIsCompleted
            ? 'đã đánh dấu hoàn thành thẻ'
            : 'đã bỏ đánh dấu hoàn thành thẻ';
        } else if (details?.field === 'Title' || details?.newTitle) {
          actionText = `đã đổi tiêu đề thành "${details.newTitle}"`;
        } else {
          actionText = 'đã chỉnh sửa thông tin thẻ';
        }
        break;
      default:
        actionText = 'đã cập nhật thẻ';
        break;
    }

    if (isComment && details?.commentId) {
      const fullComment = this.cardDetail()?.comments?.find(
        (comm) => comm.id.toLowerCase() === String(details.commentId).toLowerCase(),
      );
      if (fullComment) {
        commentContent = fullComment.contentText;
      }
    }

    return {
      id: log.id,
      authorName: log.username || 'Thành viên',
      authorAvatarUrl: log.userAvatarUrl,
      actionText,
      createdAt: this.formatDisplayDate(log.createdAt),
      isComment,
      commentContent,
    };
  }

  private normalizePriority(val: number | string | undefined): PriorityType {
    if (typeof val === 'number') {
      const map: PriorityType[] = ['Low', 'Medium', 'High', 'Urgent'];
      return map[val] ?? 'Low';
    }
    if (typeof val === 'string') {
      const lower = val.toLowerCase();
      if (lower === 'urgent') return 'Urgent';
      if (lower === 'high') return 'High';
      if (lower === 'medium') return 'Medium';
      return 'Low';
    }
    return 'Low';
  }

  private normalizeType(val: number | string | undefined): WorkType {
    if (typeof val === 'number') {
      const map: WorkType[] = ['Task', 'Bug', 'Feature', 'Epic'];
      return map[val] ?? 'Task';
    }
    if (typeof val === 'string') {
      const lower = val.toLowerCase();
      if (lower === 'bug') return 'Bug';
      if (lower === 'feature' || lower === 'features' || lower === 'story') return 'Feature';
      if (lower === 'epic') return 'Epic';
      return 'Task';
    }
    return 'Task';
  }

  private formatDateForInput(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  // Keyboard shortcut for closing (Esc)
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeModal();
  }

  closeModal(): void {
    this.closed.emit();
  }

  // Column Status Dropdown Handler
  onColumnSelected(column: ColumnSummary): void {
    if (column.isDoneColumn) {
      const unfinished = this.blockedBy().filter((d) => !d.isDone);
      if (unfinished.length > 0) {
        const names = unfinished.map((u) => `"${u.title}"`).join(', ');
        this.notificationService.error(
          `Không thể chuyển sang cột "${column.title}" vì thẻ đang bị chặn bởi: ${names}.`,
        );
        return;
      }
    }

    this.currentColumnId.set(column.id);

    // Kéo vào cột hoàn thành thì đánh dấu xong, chuyển sang cột khác giữ nguyên trạng thái
    if (column.isDoneColumn) {
      this.isCompleted.set(true);
      this.completionChanged.emit({ cardId: this.card().id, isCompleted: true });
    }

    this.columnChanged.emit({
      cardId: this.card().id,
      columnId: column.id,
      columnTitle: column.title,
    });

    setTimeout(() => {
      this.loadActivities(this.card().id);
    }, 800);
  }

  // Title Editing
  startEditingTitle(): void {
    this.isEditingTitle.set(true);
    setTimeout(() => {
      const el = this.titleInputRef()?.nativeElement;
      if (el) {
        el.focus();
        el.select();
      }
    });
  }

  saveTitle(): void {
    const trimmed = this.currentTitle().trim();
    if (!trimmed) {
      this.currentTitle.set(this.card().title);
      this.isEditingTitle.set(false);
      return;
    }
    this.isEditingTitle.set(false);
    this.titleChanged.emit({
      cardId: this.card().id,
      title: trimmed,
    });
  }

  cancelEditingTitle(): void {
    this.currentTitle.set(this.card().title);
    this.isEditingTitle.set(false);
  }

  // Toggle Completed checkbox
  toggleCompletion(): void {
    const next = !this.isCompleted();
    if (next) {
      const unfinished = this.blockedBy().filter((d) => !d.isDone);
      if (unfinished.length > 0) {
        const names = unfinished.map((u) => `"${u.title}"`).join(', ');
        this.notificationService.error(
          `Không thể hoàn thành thẻ vì đang bị chặn bởi công việc chưa xong: ${names}.`,
        );
        return;
      }
      this.isCompleted.set(true);
      this.notificationService.success('Thẻ đã được đánh dấu hoàn thành');
    } else {
      this.isCompleted.set(false);
      this.notificationService.warning('Đã bỏ đánh dấu hoàn thành');
    }
    this.completionChanged.emit({ cardId: this.card().id, isCompleted: this.isCompleted() });
  }

  // Priority Handler
  onPriorityChanged(p: PriorityType): void {
    this.currentPriority.set(p);
    this.priorityChanged.emit({ cardId: this.card().id, priority: p });
    this.notificationService.success(`Độ ưu tiên: ${p}`);
  }

  // Type Handler
  onTypeChanged(t: WorkType): void {
    this.currentType.set(t);
    this.typeChanged.emit({ cardId: this.card().id, type: t });
    this.notificationService.success(`Loại công việc: ${t}`);
  }

  // Dates Handler
  onDatesChanged(dates: { startDate: string | null; dueDate: string | null }): void {
    if (dates.dueDate && dates.startDate && dates.startDate < dates.dueDate) {
      this.currentStartDate.set(dates.startDate || '');
      this.currentDueDate.set(dates.dueDate || '');
      this.datesChanged.emit({
        cardId: this.card().id,
        startDate: dates.startDate,
        dueDate: dates.dueDate,
      });
      this.notificationService.success('Đã cập nhật thời hạn');
    } else if (dates.dueDate && dates.startDate && dates.startDate >= dates.dueDate) {
      this.notificationService.warning(
        'Ngày bắt đầu phải nhỏ hơn ngày kết thúc. Vui lòng kiểm tra lại.',
      );
    } else {
      this.notificationService.warning('Đã xoá thời hạn');
    }
  }

  // Members Handler
  onAssigneeChanged(payload: { assigneeId: string | null; assigneeName: string | null }): void {
    this.currentAssigneeId.set(payload.assigneeId);
    this.currentAssigneeName.set(payload.assigneeName);

    this.assigneeChanged.emit({
      cardId: this.card().id,
      assigneeId: payload.assigneeId,
      assigneeName: payload.assigneeName,
    });
    if (payload.assigneeName) {
      this.notificationService.success(`Đã phân công cho ${payload.assigneeName}`);
    } else {
      this.notificationService.warning('Đã gỡ phân công');
    }
  }

  // Story Points Handler
  onStoryPointsChanged(pts: number | null): void {
    this.currentStoryPoints.set(pts);
    this.storyPointsChanged.emit({
      cardId: this.card().id,
      storyPoints: pts,
    });
    if (pts !== null && pts !== undefined) {
      this.notificationService.success(`Điểm ước lượng: ${pts} pts`);
    } else {
      this.notificationService.warning('Đã xoá điểm ước lượng');
    }
  }

  // Description Handler
  onDescriptionSaved(desc: string): void {
    this.currentDescription.set(desc);
    this.descriptionChanged.emit({
      cardId: this.card().id,
      description: desc,
    });
  }

  // Cover Image Actions
  onCoverSaved(event: { coverUrl: string | null; file?: File | null }): void {
    if (event.file) {
      this.currentCoverUrl.set(event.coverUrl);
      this.coverChanged.emit({
        cardId: this.card().id,
        coverUrl: event.coverUrl,
        file: event.file,
      });
    } else {
      this.currentCoverUrl.set(event.coverUrl);
      this.coverChanged.emit({ cardId: this.card().id, coverUrl: event.coverUrl });
      if (event.coverUrl) {
        this.notificationService.success('Đã cập nhật ảnh bìa thẻ');
      } else {
        this.notificationService.warning('Đã gỡ ảnh bìa thẻ');
      }
    }
  }

  onCoverRemoved(): void {
    this.currentCoverUrl.set(null);
    this.coverChanged.emit({ cardId: this.card().id, coverUrl: null });
    this.notificationService.warning('Đã gỡ ảnh bìa thẻ');
  }

  // Add Comment & Activity
  onCommentAdded(text: string): void {
    const userName = this.currentUserName();
    const userAvatar = this.currentUserAvatar();

    const newActivity: CardDetailActivity = {
      id: `temp-${Date.now()}`,
      authorName: userName,
      authorAvatarUrl: userAvatar,
      actionText: 'đã bình luận',
      commentContent: text,
      createdAt: 'Vừa xong',
      isComment: true,
    };

    this.activities.update((items) => [newActivity, ...items]);

    this.commentAdded.emit({
      cardId: this.card().id,
      content: text,
    });

    setTimeout(() => {
      this.loadActivities(this.card().id);
    }, 800);
  }

  onDeleteCardFromModal(): void {
    const c = this.card();
    if (!c) return;
    if (confirm(`Bạn có chắc chắn muốn xoá thẻ "${c.title}"?`)) {
      this.closeModal();
      this.deleteCard.emit({
        cardId: c.id,
        columnId: c.columnId,
      });
    }
  }

  onMoreAction(action: string): void {
    this.notificationService.warning(`Thao tác "${action}" đã được ghi nhận`);
  }

  onDependencyAdded(item: CardDependencyItem): void {
    if (item.direction === 'BlockedBy') {
      this.blockedBy.update((list) => [
        item,
        ...list.filter((x) => x.dependencyId !== item.dependencyId),
      ]);
    } else {
      this.blocking.update((list) => [
        item,
        ...list.filter((x) => x.dependencyId !== item.dependencyId),
      ]);
    }
    this.dependencyChanged.emit();
  }

  onDependencyRemoved(dependencyId: string): void {
    this.blockedBy.update((list) => list.filter((item) => item.dependencyId !== dependencyId));
    this.blocking.update((list) => list.filter((item) => item.dependencyId !== dependencyId));
    this.dependencyChanged.emit();
  }

  onDependencyCardSelected(targetCardId: string): void {
    this.cardNavigated.emit(targetCardId);
  }
}
