import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ColumnSummary } from '../../../../../../../domain/models/board-detail.model';

@Component({
  selector: 'app-board-column-menu',
  standalone: true,
  imports: [CommonModule, MatIconModule, OverlayModule],
  templateUrl: './board-column-menu.component.html',
})
export class BoardColumnMenuComponent {
  readonly column = input.required<ColumnSummary>();

  readonly addCard = output<void>();
  readonly toggleDone = output<void>();
  readonly deleteColumn = output<void>();

  readonly isMenuOpen = signal<boolean>(false);

  readonly overlayPositions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 6,
      offsetX: 136,
    },
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 6,
      offsetX: 136,
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -6,
      offsetX: 136,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -6,
      offsetX: 136,
    },
  ];

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  onAddCard(): void {
    this.closeMenu();
    this.addCard.emit();
  }

  onToggleDone(): void {
    this.closeMenu();
    this.toggleDone.emit();
  }

  onDelete(): void {
    this.closeMenu();
    this.deleteColumn.emit();
  }
}
