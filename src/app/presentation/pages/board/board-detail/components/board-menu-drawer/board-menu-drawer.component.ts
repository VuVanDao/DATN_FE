import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BoardDetail } from '../../../../../../domain/models/board-detail.model';

@Component({
  selector: 'app-board-menu-drawer',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './board-menu-drawer.component.html',
})
export class BoardMenuDrawerComponent {
  @Input() isOpen = false;
  @Input() board: BoardDetail | null = null;
  @Input() isProjectLeader = false;

  @Output() closed = new EventEmitter<void>();
  @Output() openEditBoard = new EventEmitter<void>();
  @Output() openDeleteBoard = new EventEmitter<void>();
  @Output() leaveBoard = new EventEmitter<void>();

  onClose(): void {
    this.closed.emit();
  }

  onOpenEditBoard(): void {
    this.openEditBoard.emit();
  }

  onOpenDeleteBoard(): void {
    this.openDeleteBoard.emit();
  }

  onLeaveBoard(): void {
    this.leaveBoard.emit();
  }
}
