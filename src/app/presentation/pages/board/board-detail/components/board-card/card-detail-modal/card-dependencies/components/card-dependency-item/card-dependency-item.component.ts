import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  CardDependencyItem,
  getPriorityClass,
  getTypeColorClass,
  getTypeIcon,
} from '../../card-dependency.utils';

@Component({
  selector: 'app-card-dependency-item',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './card-dependency-item.component.html',
  host: {
    class: 'block',
  },
})
export class CardDependencyItemComponent {
  readonly item = input.required<CardDependencyItem>();
  readonly direction = input<'BlockedBy' | 'Blocking'>('BlockedBy');
  readonly isRemoving = input<boolean>(false);

  readonly cardClick = output<string>();
  readonly remove = output<CardDependencyItem>();

  onCardClick(): void {
    this.cardClick.emit(this.item().cardId);
  }

  onRemove(event: MouseEvent): void {
    event.stopPropagation();
    this.remove.emit(this.item());
  }

  getTypeIcon = getTypeIcon;
  getTypeColorClass = getTypeColorClass;
  getPriorityClass = getPriorityClass;
}
