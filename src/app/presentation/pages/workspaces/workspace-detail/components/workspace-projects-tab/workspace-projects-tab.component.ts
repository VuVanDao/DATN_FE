import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { PagedListState } from '../../../../../../application/state/paged-list-state.util';
import { WorkspaceProject } from '../../../../../../domain/models/workspace.model';
import {
  WorkspaceDetailView,
  WorkspaceProjectView,
} from '../../../../../view-models/workspace.view-model';
import { ProjectInfoModalComponent } from '../project-info-modal/project-info-modal.component';

@Component({
  selector: 'app-workspace-projects-tab',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, ProjectInfoModalComponent],
  templateUrl: './workspace-projects-tab.component.html',
})
export class WorkspaceProjectsTabComponent {
  private readonly router = inject(Router);

  @Input() state!: PagedListState<WorkspaceProject>;
  @Output() retry = new EventEmitter<void>();
  @Output() loadMore = new EventEmitter<void>();
  @Input() workspace!: WorkspaceDetailView;
  @Input() isOwner = false;
  @Output() createProject = new EventEmitter<void>();

  readonly selectedProjectForInfo = signal<WorkspaceProjectView | null>(null);
  readonly showProjectInfoModal = signal(false);

  openModalForCreateProject(): void {
    this.createProject.emit();
  }

  onProjectClick(project: WorkspaceProjectView): void {
    if (this.isOwner || project.isMember) {
      void this.router.navigate(
        ['/workspaces', this.workspace.id, 'projects', project.projectKey],
        { queryParams: { workspaceSlug: this.workspace.slug } },
      );
    } else {
      this.selectedProjectForInfo.set(project);
      this.showProjectInfoModal.set(true);
    }
  }

  closeProjectInfoModal(): void {
    this.showProjectInfoModal.set(false);
    this.selectedProjectForInfo.set(null);
  }
}
