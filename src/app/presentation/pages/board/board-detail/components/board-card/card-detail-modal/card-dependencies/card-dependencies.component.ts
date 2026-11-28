import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { RemoveCardDependencyUseCase } from '../../../../../../../../application/board/remove-card-dependency.use-case';
import { NotificationService } from '../../../../../../../../application/shared/notification.service';
import { CardDependencyItem } from '../../../../../../../../domain/models/board-detail.model';
import { CardDependencyFormComponent } from './components/card-dependency-form/card-dependency-form.component';
import { CardDependencyItemComponent } from './components/card-dependency-item/card-dependency-item.component';

@Component({
  selector: 'app-card-dependencies',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    CardDependencyFormComponent,
    CardDependencyItemComponent,
  ],
  templateUrl: './card-dependencies.component.html',
  host: {
    class: 'block',
  },
})
export class CardDependenciesComponent {
  private readonly removeDependencyUseCase = inject(RemoveCardDependencyUseCase);
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

  readonly isAddOpen = signal<boolean>(false);
  readonly removingId = signal<string | null>(null);

  toggleAddForm(): void {
    this.isAddOpen.update((v) => !v);
  }

  closeAddForm(): void {
    this.isAddOpen.set(false);
  }

  onDependencyAdded(item: CardDependencyItem): void {
    this.dependencyAdded.emit(item);
    this.closeAddForm();
  }

  removeDependency(dep: CardDependencyItem): void {
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
}
