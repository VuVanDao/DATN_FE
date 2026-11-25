import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { LayoutService } from '../../../application/layout/layout.service';
import { WorkspaceStore } from '../../../application/state/workspace.store';
import { Workspace } from '../../../domain/models/workspace.model';
import { toWorkspaceView } from '../../view-models/workspace.view-model';

@Component({
  selector: 'app-workspaces-page',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './workspaces.page.html',
})
export class WorkspacesPage implements OnInit {
  readonly workspaceStore = inject(WorkspaceStore);
  readonly workspaces = computed(() => this.workspaceStore.workspaces().map(toWorkspaceView));
  private readonly layoutService = inject(LayoutService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.layoutService.setSidebar('main');
    this.workspaceStore.loadWorkspaces();
  }

  getRoleBadge(role?: string | null): string {
    if (role === 'WorkspaceOwner') {
      return 'Người tạo workspace';
    }
    return 'Thành viên';
  }

  //
  onSelectWorkspaceFunc(ws: Workspace): void {
    this.workspaceStore.selectWorkspace(ws.id);
    toast.info(`Đã chọn không gian làm việc: ${ws.name}`);
    this.router.navigate(['/workspaces', ws.slug]);
  }
}
