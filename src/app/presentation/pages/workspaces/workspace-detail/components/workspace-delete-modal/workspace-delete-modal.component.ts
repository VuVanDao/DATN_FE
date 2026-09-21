import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { WorkspaceDetail } from '../../../../../../domain/models/workspace.model';
import { WorkspaceStore } from '../../../../../state/workspace.store';

@Component({
  selector: 'app-workspace-delete-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './workspace-delete-modal.component.html',
})
export class WorkspaceDeleteModalComponent {
  readonly workspaceStore = inject(WorkspaceStore);

  @Input() isOpen = false;
  @Input() workspace: WorkspaceDetail | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();

  // Tùy chọn nhập xác nhận tên workspace để tránh ấn nhầm
  readonly confirmNameInput = signal<string>('');

  readonly isNameMatched = computed(() => {
    if (!this.workspace) return false;
    return this.confirmNameInput().trim() === this.workspace.name.trim();
  });

  close(): void {
    this.confirmNameInput.set('');
    this.closed.emit();
  }

  confirm(): void {
    if (!this.workspace || !this.isNameMatched) return;
    this.confirmed.emit();
  }
}
