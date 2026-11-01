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
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SessionService } from '../../../../../../application/auth/session.service';
import { NotificationService } from '../../../../../../application/shared/notification.service';
import {
  CardDetail,
  CardSummary,
  ColumnSummary,
} from '../../../../../../domain/models/board-detail.model';
import { ProjectMember } from '../../../../../../domain/models/project.model';

export type PriorityType = 'Low' | 'Medium' | 'High' | 'Urgent';
export type WorkType = 'Task' | 'Bug' | 'Feature' | 'Epic';

export interface PriorityOption {
  value: PriorityType;
  label: string;
  icon: string;
  colorClass: string;
  bgPillClass: string;
}

export interface WorkTypeOption {
  value: WorkType;
  label: string;
  icon: string;
  colorClass: string;
  bgPillClass: string;
}

export interface CardDetailAttachment {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  isCover: boolean;
}

export interface CardDetailActivity {
  id: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  actionText: string;
  createdAt: string;
  isComment?: boolean;
  commentContent?: string;
}

@Component({
  selector: 'app-card-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './card-detail-modal.component.html',
})
export class CardDetailModalComponent implements OnInit {
  private readonly sessionService = inject(SessionService);
  private readonly notificationService = inject(NotificationService);

  // Inputs
  readonly isOpen = input<boolean>(false);
  readonly card = input.required<CardSummary>();
  readonly cardDetail = input<CardDetail | null>(null);
  readonly isLoading = input<boolean>(false);
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
  readonly progressChanged = output<{ cardId: string; progress: number }>();
  readonly deleteCard = output<{ cardId: string; columnId: string }>();

  // Element refs
  readonly titleInputRef = viewChild<ElementRef<HTMLTextAreaElement>>('titleInput');
  readonly descriptionInputRef = viewChild<ElementRef<HTMLTextAreaElement>>('descriptionInput');
  readonly commentInputRef = viewChild<ElementRef<HTMLTextAreaElement>>('commentInput');

  // Local Editable States
  readonly currentTitle = signal<string>('');
  readonly isEditingTitle = signal<boolean>(false);

  readonly currentDescription = signal<string>('');
  readonly isEditingDescription = signal<boolean>(false);

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

  // Progress Percentage State
  readonly currentProgress = signal<number>(0);

  // Dropdown states
  readonly isColumnDropdownOpen = signal<boolean>(false);
  readonly isMoreMenuOpen = signal<boolean>(false);
  readonly isPriorityMenuOpen = signal<boolean>(false);
  readonly isTypeMenuOpen = signal<boolean>(false);
  readonly isDatesMenuOpen = signal<boolean>(false);
  readonly isMembersMenuOpen = signal<boolean>(false);

  // Comments & Activities
  readonly newCommentText = signal<string>('');
  readonly isWritingComment = signal<boolean>(false);
  readonly showActivityDetails = signal<boolean>(true);
  readonly currentUser = computed(() => this.sessionService.currentUser());
  readonly currentUserName = computed(() => {
    const u = this.currentUser();
    return u?.userName || 'Tôi';
  });
  readonly currentUserAvatar = computed(() => this.currentUser()?.avatarUrl);

  // Cover State
  readonly isCoverMenuOpen = signal<boolean>(false);
  readonly coverUrlInput = signal<string>('');
  readonly previewCoverUrl = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);

  // Priority Options Definitions
  readonly priorityOptions: PriorityOption[] = [
    {
      value: 'Low',
      label: 'Low',
      icon: 'arrow_downward',
      colorClass: 'text-emerald-500 dark:text-emerald-400',
      bgPillClass:
        'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30',
    },
    {
      value: 'Medium',
      label: 'Medium',
      icon: 'drag_handle',
      colorClass: 'text-amber-500 dark:text-amber-400',
      bgPillClass:
        'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30',
    },
    {
      value: 'High',
      label: 'High',
      icon: 'arrow_upward',
      colorClass: 'text-orange-500 dark:text-orange-400',
      bgPillClass:
        'bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-500/30',
    },
    {
      value: 'Urgent',
      label: 'Urgent',
      icon: 'priority_high',
      colorClass: 'text-rose-500 dark:text-rose-400',
      bgPillClass:
        'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30',
    },
  ];

  // Work Type Options Definitions
  readonly typeOptions: WorkTypeOption[] = [
    {
      value: 'Task',
      label: 'Task',
      icon: 'task_alt',
      colorClass: 'text-sky-500 dark:text-sky-400',
      bgPillClass:
        'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-500/30',
    },
    {
      value: 'Bug',
      label: 'Bug',
      icon: 'pest_control',
      colorClass: 'text-rose-500 dark:text-rose-400',
      bgPillClass:
        'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30',
    },
    {
      value: 'Feature',
      label: 'Feature',
      icon: 'bookmark',
      colorClass: 'text-emerald-500 dark:text-emerald-400',
      bgPillClass:
        'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30',
    },
    {
      value: 'Epic',
      label: 'Epic',
      icon: 'bolt',
      colorClass: 'text-purple-500 dark:text-purple-400',
      bgPillClass:
        'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30',
    },
  ];

  // Attachments mock list
  readonly attachments = signal<CardDetailAttachment[]>([]);

  // Activity list
  readonly activities = signal<CardDetailActivity[]>([]);

  constructor() {
    effect(() => {
      const detail = this.cardDetail();
      if (detail && detail.id === this.card().id) {
        this.syncWithDetail(detail);
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
    if (!this.isEditingDescription()) {
      this.currentDescription.set(d.description || '');
    }
    this.currentCoverUrl.set(d.coverUrl || null);
    this.currentColumnId.set(d.columnId || '');
    this.currentPriority.set(this.normalizePriority(d.priority));
    this.currentType.set(this.normalizeType(d.type));
    this.currentStartDate.set(this.formatDateForInput(d.startDate));
    this.currentDueDate.set(this.formatDateForInput(d.dueDate));
    this.currentAssigneeId.set(d.assigneeId || null);
    if (d.assigneeId) {
      const member = this.members().find((m) => m.userId === d.assigneeId);
      this.currentAssigneeName.set(d.assigneeName || member?.username || this.currentAssigneeName());
    } else {
      this.currentAssigneeName.set(null);
    }
    this.currentReporterName.set(d.reporterName || 'Đạo Vũ Văn');
    this.currentProgress.set(d.progressPercentage || 0);

    // Sync Attachments
    if (d.coverUrl) {
      this.attachments.set([
        {
          id: 'cover-att',
          name: 'Cover Image',
          url: d.coverUrl,
          createdAt: this.formatDisplayDate(d.createdAt),
          isCover: true,
        },
      ]);
    } else {
      this.attachments.set([]);
    }

    // Sync Comments from Backend API
    const defaultActivity: CardDetailActivity = {
      id: 'initial-act',
      authorName: d.reporterName || 'Thành viên',
      authorAvatarUrl: d.reporterAvatarUrl,
      actionText: 'đã tạo thẻ',
      createdAt: this.formatDisplayDate(d.createdAt),
    };

    if (d.comments && d.comments.length > 0) {
      const commentActivities: CardDetailActivity[] = d.comments.map((c) => ({
        id: c.id,
        authorName: c.username || 'Thành viên',
        authorAvatarUrl: c.userAvatarUrl,
        actionText: 'đã bình luận',
        commentContent: c.contentText,
        createdAt: this.formatDisplayDate(c.createdAt),
        isComment: true,
      }));
      this.activities.set([...commentActivities, defaultActivity]);
    } else {
      this.activities.set([defaultActivity]);
    }
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

    this.currentTitle.set(c.title || '');
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
    this.currentReporterName.set(c.reporterName || 'Đạo Vũ Văn');

    // Progress
    this.currentProgress.set(c.progressPercentage || 0);

    // Attachments
    if (c.coverUrl) {
      this.attachments.set([
        {
          id: 'cover-att',
          name: 'Cover Image',
          url: c.coverUrl,
          createdAt: this.formatDisplayDate(c.createdAt),
          isCover: true,
        },
      ]);
    } else {
      this.attachments.set([]);
    }

    // Initial activities
    const user = this.sessionService.currentUser();
    const userName = user?.userName || c.reporterName || 'Thành viên';

    const defaultActivity: CardDetailActivity = {
      id: 'initial-act',
      authorName: c.reporterName || userName,
      authorAvatarUrl: c.reporterAvatarUrl || (c.reporterId === user?.id ? user?.avatarUrl : null),
      actionText: 'đã tạo thẻ',
      createdAt: this.formatDisplayDate(c.createdAt),
    };

    this.activities.set([defaultActivity]);
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
    console.log('[CardDetail] Modal closed');
    this.closeAllDropdowns();
    this.closed.emit();
  }

  closeAllDropdowns(): void {
    this.isColumnDropdownOpen.set(false);
    this.isMoreMenuOpen.set(false);
    this.isPriorityMenuOpen.set(false);
    this.isTypeMenuOpen.set(false);
    this.isDatesMenuOpen.set(false);
    this.isMembersMenuOpen.set(false);
    this.isCoverMenuOpen.set(false);
  }

  // Column Status Dropdown
  getCurrentColumnTitle(): string {
    const col = this.columns().find((c) => c.id === this.currentColumnId());
    return col?.title || 'Doing';
  }

  toggleColumnDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isColumnDropdownOpen.update((v) => !v);
    this.isMoreMenuOpen.set(false);
  }

  selectColumn(column: ColumnSummary): void {
    console.log('[CardDetail] Column changed to:', column.title, 'ColumnId:', column.id);
    this.currentColumnId.set(column.id);
    this.isColumnDropdownOpen.set(false);

    const user = this.sessionService.currentUser();
    const userName = user?.userName || 'Đạo Vũ Văn';
    this.activities.update((items) => [
      {
        id: `act-${Date.now()}`,
        authorName: userName,
        actionText: `moved this card to ${column.title}`,
        createdAt: 'Just now',
      },
      ...items,
    ]);

    this.columnChanged.emit({
      cardId: this.card().id,
      columnId: column.id,
      columnTitle: column.title,
    });
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
    console.log('[CardDetail] Title updated to:', trimmed);
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
    this.isCompleted.set(next);
    console.log('[CardDetail] Card completed state toggled:', next);
    if (next) {
      this.currentProgress.set(100);
      this.notificationService.success('Thẻ đã được đánh dấu hoàn thành');
    } else {
      this.currentProgress.set(0);
      this.notificationService.warning('Đã bỏ đánh dấu hoàn thành');
    }
    this.progressChanged.emit({ cardId: this.card().id, progress: this.currentProgress() });
  }

  // Priority Handler
  getCurrentPriorityOption(): PriorityOption {
    return (
      this.priorityOptions.find((p) => p.value === this.currentPriority()) ||
      this.priorityOptions[0]
    );
  }

  togglePriorityMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isPriorityMenuOpen.update((v) => !v);
    this.isTypeMenuOpen.set(false);
    this.isDatesMenuOpen.set(false);
    this.isMembersMenuOpen.set(false);
    this.isCoverMenuOpen.set(false);
  }

  selectPriority(p: PriorityOption): void {
    console.log('[CardDetail] Priority changed to:', p.value);
    this.currentPriority.set(p.value);
    this.isPriorityMenuOpen.set(false);
    this.priorityChanged.emit({ cardId: this.card().id, priority: p.value });
    this.notificationService.success(`Độ ưu tiên: ${p.label}`);
  }

  // Type Handler
  getCurrentTypeOption(): WorkTypeOption {
    return this.typeOptions.find((t) => t.value === this.currentType()) || this.typeOptions[0];
  }

  toggleTypeMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isTypeMenuOpen.update((v) => !v);
    this.isPriorityMenuOpen.set(false);
    this.isDatesMenuOpen.set(false);
    this.isMembersMenuOpen.set(false);
    this.isCoverMenuOpen.set(false);
  }

  selectType(t: WorkTypeOption): void {
    console.log('[CardDetail] Type changed to:', t.value);
    this.currentType.set(t.value);
    this.isTypeMenuOpen.set(false);
    this.typeChanged.emit({ cardId: this.card().id, type: t.value });
    this.notificationService.success(`Loại công việc: ${t.label}`);
  }

  // Dates Handler
  toggleDatesMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isDatesMenuOpen.update((v) => !v);
    this.isPriorityMenuOpen.set(false);
    this.isTypeMenuOpen.set(false);
    this.isMembersMenuOpen.set(false);
  }

  saveDates(): void {
    const s = this.currentStartDate() || null;
    const d = this.currentDueDate() || null;
    console.log('[CardDetail] Dates saved:', { startDate: s, dueDate: d });
    this.isDatesMenuOpen.set(false);
    this.datesChanged.emit({
      cardId: this.card().id,
      startDate: s,
      dueDate: d,
    });
    this.notificationService.success('Đã cập nhật thời hạn');
  }

  clearDates(): void {
    console.log('[CardDetail] Dates cleared');
    this.currentStartDate.set('');
    this.currentDueDate.set('');
    this.isDatesMenuOpen.set(false);
    this.datesChanged.emit({
      cardId: this.card().id,
      startDate: null,
      dueDate: null,
    });
    this.notificationService.warning('Đã xóa thời hạn công việc');
  }

  // Members Handler
  toggleMembersMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isMembersMenuOpen.update((v) => !v);
    this.isPriorityMenuOpen.set(false);
    this.isTypeMenuOpen.set(false);
    this.isDatesMenuOpen.set(false);
  }

  assignMember(member: ProjectMember): void {
    console.log('[CardDetail] Assigned member:', member.username, member.userId);
    this.currentAssigneeId.set(member.userId);
    this.currentAssigneeName.set(member.username);
    this.isMembersMenuOpen.set(false);

    this.assigneeChanged.emit({
      cardId: this.card().id,
      assigneeId: member.userId,
      assigneeName: member.username,
    });
    this.notificationService.success(`Đã phân công cho ${member.username}`);
  }

  unassignMember(): void {
    console.log('[CardDetail] Removed assignment');
    this.currentAssigneeId.set(null);
    this.currentAssigneeName.set(null);
    this.isMembersMenuOpen.set(false);

    this.assigneeChanged.emit({
      cardId: this.card().id,
      assigneeId: null,
      assigneeName: null,
    });
    this.notificationService.warning('Đã gỡ phân công');
  }

  // Progress Handler
  setProgress(percent: number): void {
    console.log('[CardDetail] Progress updated to:', percent);
    this.currentProgress.set(percent);
    this.isCompleted.set(percent === 100);
    this.progressChanged.emit({
      cardId: this.card().id,
      progress: percent,
    });
  }

  // Description Editing
  startEditingDescription(): void {
    this.isEditingDescription.set(true);
    setTimeout(() => {
      this.descriptionInputRef()?.nativeElement?.focus();
    });
  }

  saveDescription(): void {
    const desc = this.currentDescription().trim();
    console.log('[CardDetail] Description saved:', desc);
    this.currentDescription.set(desc);
    this.isEditingDescription.set(false);
    this.descriptionChanged.emit({
      cardId: this.card().id,
      description: desc,
    });
  }

  cancelEditingDescription(): void {
    this.currentDescription.set(this.card().description || '');
    this.isEditingDescription.set(false);
  }

  // Cover Image Actions & Picker
  openCoverPicker(event?: MouseEvent): void {
    event?.stopPropagation();
    this.closeAllDropdowns();
    this.selectedFile.set(null);
    this.coverUrlInput.set(this.currentCoverUrl() || '');
    this.previewCoverUrl.set(this.currentCoverUrl() || null);
    this.isCoverMenuOpen.set(true);
  }

  closeCoverPicker(): void {
    this.isCoverMenuOpen.set(false);
  }

  onCoverUrlChange(val: string): void {
    this.selectedFile.set(null);
    this.coverUrlInput.set(val);
    this.previewCoverUrl.set(val.trim() || null);
  }

  onCoverFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.error('Kích thước ảnh tối đa là 5MB.');
        return;
      }
      this.selectedFile.set(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.previewCoverUrl.set(result);
        this.coverUrlInput.set(file.name);
      };
      reader.readAsDataURL(file);
    }
  }

  saveCover(): void {
    const file = this.selectedFile();
    const trimmed = this.coverUrlInput().trim();
    const finalUrl = trimmed || null;
    this.closeCoverPicker();

    if (file) {
      this.currentCoverUrl.set(this.previewCoverUrl());
      this.coverChanged.emit({ cardId: this.card().id, coverUrl: this.previewCoverUrl(), file });
    } else {
      this.currentCoverUrl.set(finalUrl);
      this.coverChanged.emit({ cardId: this.card().id, coverUrl: finalUrl });
      if (finalUrl) {
        this.notificationService.success('Đã cập nhật ảnh bìa thẻ');
      } else {
        this.notificationService.warning('Đã gỡ ảnh bìa thẻ');
      }
    }
  }

  removeCover(): void {
    this.selectedFile.set(null);
    this.currentCoverUrl.set(null);
    this.coverUrlInput.set('');
    this.previewCoverUrl.set(null);
    this.closeCoverPicker();
    this.coverChanged.emit({ cardId: this.card().id, coverUrl: null });
    this.notificationService.warning('Đã gỡ ảnh bìa thẻ');
  }

  // Add Comment & Activity
  startWritingComment(): void {
    this.isWritingComment.set(true);
    setTimeout(() => {
      this.commentInputRef()?.nativeElement?.focus();
    });
  }

  saveComment(): void {
    const text = this.newCommentText().trim();
    if (!text) return;

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
    this.newCommentText.set('');
    this.isWritingComment.set(false);

    this.commentAdded.emit({
      cardId: this.card().id,
      content: text,
    });
  }

  cancelComment(): void {
    this.newCommentText.set('');
    this.isWritingComment.set(false);
  }

  toggleShowDetails(): void {
    this.showActivityDetails.update((v) => !v);
  }

  toggleMoreMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isMoreMenuOpen.update((v) => !v);
    this.isColumnDropdownOpen.set(false);
  }

  onDeleteCardFromModal(): void {
    const c = this.card();
    if (!c) return;
    this.closeAllDropdowns();
    if (confirm(`Bạn có chắc chắn muốn xoá thẻ "${c.title}"?`)) {
      this.closeModal();
      this.deleteCard.emit({
        cardId: c.id,
        columnId: c.columnId,
      });
    }
  }

  onMoreAction(action: string): void {
    console.log('[CardDetail] More option clicked:', action);
    this.isMoreMenuOpen.set(false);
    this.notificationService.warning(`Thao tác "${action}" đã được ghi nhận`);
  }
}
