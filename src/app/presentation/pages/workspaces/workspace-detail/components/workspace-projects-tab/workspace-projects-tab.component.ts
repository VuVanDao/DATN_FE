import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { WorkspaceDetail } from '../../../../../../domain/models/workspace.model';

@Component({
  selector: 'app-workspace-projects-tab',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './workspace-projects-tab.component.html',
})
export class WorkspaceProjectsTabComponent {
  @Input() workspace!: WorkspaceDetail;
  @Input() isOwner = false;
  @Output() createProject = new EventEmitter<void>();
  openModalForCreateProject(): void {
    this.createProject.emit();
  }
}
