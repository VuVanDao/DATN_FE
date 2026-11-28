import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AddCardDependencyUseCase } from '../../../../../../../../../../application/board/add-card-dependency.use-case';
import { SearchCardCandidatesUseCase } from '../../../../../../../../../../application/board/search-card-candidates.use-case';
import { NotificationService } from '../../../../../../../../../../application/shared/notification.service';
import {
  CardCandidate,
  CardDependencyItem,
} from '../../../../../../../../../../domain/models/board-detail.model';
import {
  getPriorityClass,
  getTypeColorClass,
  getTypeIcon,
} from '../../../../../../../../../../shared/utils/card-ui.util';

@Component({
  selector: 'app-card-dependency-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './card-dependency-form.component.html',
  host: {
    class: 'block',
  },
})
export class CardDependencyFormComponent implements OnInit {
  private readonly addDependencyUseCase = inject(AddCardDependencyUseCase);
  private readonly searchCandidatesUseCase = inject(SearchCardCandidatesUseCase);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly cardId = input.required<string>();

  readonly added = output<CardDependencyItem>();
  readonly cancelled = output<void>();

  readonly selectedDirection = signal<'BlockedBy' | 'Blocking'>('BlockedBy');
  readonly searchQuery = signal<string>('');
  readonly candidates = signal<CardCandidate[]>([]);
  readonly isSearching = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

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
          console.error('[CardDependencyForm] Lỗi tìm kiếm thẻ ứng viên:', err);
          this.isSearching.set(false);
        },
      });
  }

  ngOnInit(): void {
    this.loadInitialCandidates();
  }

  setDirection(direction: 'BlockedBy' | 'Blocking'): void {
    this.selectedDirection.set(direction);
  }

  onSearchChange(text: string): void {
    this.searchQuery.set(text);
    this.searchSubject.next(text);
  }

  closeForm(): void {
    this.cancelled.emit();
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
          console.error('[CardDependencyForm] Lỗi tải danh sách gợi ý:', err);
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
          this.added.emit(createdItem);
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

  getTypeIcon = getTypeIcon;
  getTypeColorClass = getTypeColorClass;
  getPriorityClass = getPriorityClass;
}
