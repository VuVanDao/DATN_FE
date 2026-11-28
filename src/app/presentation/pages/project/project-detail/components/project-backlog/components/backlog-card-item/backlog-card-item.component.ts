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
import {
  getPriorityClass,
  getTypeColorClass,
  getTypeIcon,
  getTypeLabel,
} from '../../../../../../../../shared/utils/card-ui.util';

@Component({
  selector: 'app-backlog-card-item',
  standalone: true,
  imports: [CommonModule, MatIconModule, CdkDrag, CdkDragPlaceholder],
  templateUrl: './backlog-card-item.component.html',
  host: {
    class: 'block',
    '[class.relative]': 'showQuickMoveMenu()',
    '[class.z-30]': 'showQuickMoveMenu()',
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

  readonly getPriorityClass = getPriorityClass;
  readonly getTypeIcon = getTypeIcon;
  readonly getTypeColorClass = getTypeColorClass;
  readonly getTypeLabel = getTypeLabel;
}
