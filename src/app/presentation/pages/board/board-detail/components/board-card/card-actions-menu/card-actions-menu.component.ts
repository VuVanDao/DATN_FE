import { ConnectedPosition, CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CardSummary } from '../../../../../../../domain/models/board-detail.model';

@Component({
  selector: 'app-card-actions-menu',
  standalone: true,
  imports: [CommonModule, MatIconModule, OverlayModule],
  templateUrl: './card-actions-menu.component.html',
})
export class CardActionsMenuComponent {
  readonly origin = input.required<CdkOverlayOrigin>();
  readonly isOpen = input<boolean>(false);
  readonly card = input.required<CardSummary>();

  readonly openDetail = output<void>();
  readonly editTitle = output<void>();
  readonly changeCover = output<void>();
  readonly changeMembers = output<void>();
  readonly changeDueDate = output<void>();
  readonly moveCard = output<void>();
  readonly copyCard = output<void>();
  readonly deleteCard = output<void>();
  readonly closed = output<void>();

  readonly overlayPositions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 4,
      offsetX: 124,
    },
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 4,
      offsetX: 124,
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -4,
      offsetX: 124,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -4,
      offsetX: 124,
    },
  ];

  onOpenDetail(): void {
    this.closed.emit();
    this.openDetail.emit();
  }

  onEditTitle(): void {
    this.closed.emit();
    this.editTitle.emit();
  }

  onChangeCover(): void {
    this.closed.emit();
    this.changeCover.emit();
  }

  onChangeMembers(): void {
    this.closed.emit();
    this.changeMembers.emit();
  }

  onChangeDueDate(): void {
    this.closed.emit();
    this.changeDueDate.emit();
  }

  onMoveCard(): void {
    this.closed.emit();
    this.moveCard.emit();
  }

  onCopyCard(): void {
    this.closed.emit();
    this.copyCard.emit();
  }

  onDeleteCard(): void {
    this.closed.emit();
    this.deleteCard.emit();
  }
}
