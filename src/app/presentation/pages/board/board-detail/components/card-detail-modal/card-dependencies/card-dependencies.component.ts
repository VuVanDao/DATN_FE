import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AddCardDependencyUseCase } from '../../../../../../../application/board/add-card-dependency.use-case';
import { RemoveCardDependencyUseCase } from '../../../../../../../application/board/remove-card-dependency.use-case';
import { SearchCardCandidatesUseCase } from '../../../../../../../application/board/search-card-candidates.use-case';
import { NotificationService } from '../../../../../../../application/shared/notification.service';
import {
  CardCandidate,
  CardDependencyItem,
} from '../../../../../../../domain/models/board-detail.model';

@Component({
  selector: 'app-card-dependencies',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './card-dependencies.component.html',
  host: {
    class: 'block',
  },
})
export class CardDependenciesComponent {
  private readonly addDependencyUseCase = inject(AddCardDependencyUseCase);
  private readonly removeDependencyUseCase = inject(RemoveCardDependencyUseCase);
  private readonly searchCandidatesUseCase = inject(SearchCardCandidatesUseCase);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  // Inputs
  readonly cardId = input.required<string>();
  readonly blockedBy = input<CardDependencyItem[]>([]);
  readonly blocking = input<CardDependencyItem[]>([]);

  // Outputs
  readonly dependencyAdded = output<CardDependencyItem>();
  readonly dependencyRemoved = output<string>();
  readonly cardSelected = output<string>();

  // Add dependency form states
  readonly isAddOpen = signal<boolean>(false);
  readonly selectedDirection = signal<'BlockedBy' | 'Blocking'>('BlockedBy');
  readonly searchQuery = signal<string>('');
  readonly candidates = signal<CardCandidate[]>([]);
  readonly isSearching = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly removingId = signal<string | null>(null);

  private readonly searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((query) => {
          this.isSearching.set(true);
          return this.searchCandidatesUseCase.execute(this.cardId(), query);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (results) => {
          this.candidates.set(results);
          this.isSearching.set(false);
        },
        error: (err) => {
          console.error('[CardDependencies] Lỗi tìm kiếm thẻ ứng viên:', err);
          this.isSearching.set(false);
        },
      });
  }

  toggleAddForm(): void {
    const nextState = !this.isAddOpen();
    this.isAddOpen.set(nextState);
    if (nextState) {
      this.searchQuery.set('');
      this.candidates.set([]);
      this.loadInitialCandidates();
    }
  }

  closeAddForm(): void {
    this.isAddOpen.set(false);
    this.searchQuery.set('');
    this.candidates.set([]);
  }

  setDirection(direction: 'BlockedBy' | 'Blocking'): void {
    this.selectedDirection.set(direction);
  }

  onSearchChange(text: string): void {
    this.searchQuery.set(text);
    this.searchSubject.next(text);
  }

  private loadInitialCandidates(): void {
    this.isSearching.set(true);
    this.searchCandidatesUseCase
      .execute(this.cardId(), '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          this.candidates.set(results);
          this.isSearching.set(false);
        },
        error: (err) => {
          console.error('[CardDependencies] Lỗi tải danh sách gợi ý:', err);
          this.isSearching.set(false);
        },
      });
  }

  selectCandidate(candidate: CardCandidate): void {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    const direction = this.selectedDirection();

    this.addDependencyUseCase
      .execute(this.cardId(), {
        targetCardId: candidate.id,
        direction,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (createdItem) => {
          this.isSubmitting.set(false);
          this.notificationService.success(
            direction === 'BlockedBy'
              ? `Đã liên kết: Thẻ này bị chặn bởi "${candidate.title}"`
              : `Đã liên kết: Thẻ này đang chặn "${candidate.title}"`,
          );
          this.dependencyAdded.emit(createdItem);
          this.closeAddForm();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const errorMsg =
            err?.error?.message ||
            err?.message ||
            'Không thể thiết lập liên kết phụ thuộc. Vui lòng kiểm tra lại.';
          this.notificationService.error(errorMsg);
        },
      });
  }

  removeDependency(dep: CardDependencyItem, event: MouseEvent): void {
    event.stopPropagation();
    if (this.removingId()) return;

    this.removingId.set(dep.dependencyId);
    this.removeDependencyUseCase
      .execute(dep.dependencyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.removingId.set(null);
          this.notificationService.success(`Đã gỡ liên kết với "${dep.title}".`);
          this.dependencyRemoved.emit(dep.dependencyId);
        },
        error: (err) => {
          this.removingId.set(null);
          const errorMsg =
            err?.error?.message || err?.message || 'Không thể gỡ liên kết phụ thuộc.';
          this.notificationService.error(errorMsg);
        },
      });
  }

  onCardClick(cardId: string): void {
    this.cardSelected.emit(cardId);
  }

  getTypeIcon(type: number | string): string {
    const t = String(type).toLowerCase();
    switch (t) {
      case '1':
      case 'bug':
        return 'pest_control';
      case '2':
      case 'story':
      case 'feature':
        return 'bookmark';
      case '3':
      case 'epic':
        return 'bolt';
      default:
        return 'task_alt';
    }
  }

  getTypeColorClass(type: number | string): string {
    const t = String(type).toLowerCase();
    switch (t) {
      case '1':
      case 'bug':
        return 'text-rose-500';
      case '2':
      case 'story':
      case 'feature':
        return 'text-emerald-500';
      case '3':
      case 'epic':
        return 'text-purple-500';
      default:
        return 'text-sky-500';
    }
  }

  getPriorityClass(priority: number | string): string {
    const p = String(priority).toLowerCase();
    switch (p) {
      case '3':
      case 'urgent':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900';
      case '2':
      case 'high':
        return 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900';
      case '1':
      case 'medium':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      default:
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
    }
  }
}
