import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { WorkspaceProjectView } from '../../../../../view-models/workspace.view-model';

@Component({
  selector: 'app-project-info-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './project-info-modal.component.html',
})
export class ProjectInfoModalComponent {
  @Input() isOpen = false;
  @Input() project: WorkspaceProjectView | null = null;
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }
}
