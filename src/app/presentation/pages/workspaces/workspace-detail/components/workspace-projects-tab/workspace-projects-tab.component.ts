import { WorkspaceProject } from '../../../../../../domain/models/workspace.model';
import { PagedListState } from '../../../../../../application/state/paged-list-state.util';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { WorkspaceDetailView } from '../../../../../view-models/workspace.view-model';

@Component({
  selector: 'app-workspace-projects-tab',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './workspace-projects-tab.component.html',
})
export class WorkspaceProjectsTabComponent {
  ngOnInit(): void {
    // alert('OnInit');
  }
  @Input() state!: PagedListState<WorkspaceProject>;
  @Output() retry = new EventEmitter<void>();
  @Output() loadMore = new EventEmitter<void>();
  @Input() workspace!: WorkspaceDetailView;
  @Input() isOwner = false;
  @Output() createProject = new EventEmitter<void>();
  openModalForCreateProject(): void {
    this.createProject.emit();
  }
}
