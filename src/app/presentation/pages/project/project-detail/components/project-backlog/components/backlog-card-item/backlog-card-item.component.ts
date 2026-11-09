import { CdkDrag, CdkDragPlaceholder } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CardSummary } from '../../../../../../../../domain/models/board-detail.model';

@Component({
  selector: 'app-backlog-card-item',
  standalone: true,
  imports: [CommonModule, MatIconModule, CdkDrag, CdkDragPlaceholder],
  templateUrl: './backlog-card-item.component.html',
  host: {
    class: 'block',
  },
})
export class BacklogCardItemComponent {
  @Input({ required: true }) card!: CardSummary;
  @Input() currentSprintId: string | null = null;
  @Input() availableSprints: { id: string; name: string }[] = [];
  @Input() canMoveCard = false;

  @Output() cardClick = new EventEmitter<CardSummary>();
  @Output() quickMove = new EventEmitter<{ cardId: string; targetSprintId: string | null }>();

  readonly showQuickMoveMenu = signal<boolean>(false);

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.showQuickMoveMenu()) {
      this.showQuickMoveMenu.set(false);
    }
  }

  toggleQuickMove(event: Event): void {
    event.stopPropagation();
    this.showQuickMoveMenu.update((v) => !v);
  }

  selectTarget(targetSprintId: string | null, event: Event): void {
    event.stopPropagation();
    this.showQuickMoveMenu.set(false);
    this.quickMove.emit({ cardId: this.card.id, targetSprintId });
  }

  onCardClick(): void {
    this.cardClick.emit(this.card);
  }

  getPriorityClass(priority: number | string): string {
    const p = String(priority).toLowerCase();
    switch (p) {
      case 'urgent':
      case '3':
        return 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60';
      case 'high':
      case '2':
        return 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60';
      case 'medium':
      case '1':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60';
      default:
        return 'text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  }

  getTypeIcon(type: number | string): string {
    const t = String(type).toLowerCase();
    switch (t) {
      case 'bug':
      case '1':
        return 'pest_control';
      case 'feature':
      case 'features':
      case 'story':
      case '2':
        return 'bookmark';
      case 'epic':
      case '3':
        return 'bolt';
      default:
        return 'task_alt';
    }
  }

  getTypeColorClass(type: number | string): string {
    const t = String(type).toLowerCase();
    switch (t) {
      case 'bug':
      case '1':
        return 'text-rose-500 dark:text-rose-400';
      case 'feature':
      case 'features':
      case 'story':
      case '2':
        return 'text-emerald-500 dark:text-emerald-400';
      case 'epic':
      case '3':
        return 'text-purple-500 dark:text-purple-400';
      default:
        return 'text-sky-500 dark:text-sky-400';
    }
  }

  getTypeLabel(type: number | string): string {
    const t = String(type).toLowerCase();
    switch (t) {
      case 'bug':
      case '1':
        return 'Bug';
      case 'feature':
      case 'features':
      case 'story':
      case '2':
        return 'Feature';
      case 'epic':
      case '3':
        return 'Epic';
      default:
        return 'Task';
    }
  }
}
