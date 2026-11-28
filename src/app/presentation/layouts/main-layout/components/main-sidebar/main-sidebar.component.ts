import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../../../layout.service';
import { AuthStore } from '../../../../../application/state/auth.store';
import { WorkspaceStore } from '../../../../../application/state/workspace.store';
import { WorkspaceCreateModalComponent } from '../../../../pages/workspaces/components/workspace-create-modal/workspace-create-modal.component';
import { toWorkspaceView } from '../../../../view-models/workspace.view-model';
import { MainSidebarRecentComponent } from '../main-sidebar-recent/main-sidebar-recent.component';
import { MainSidebarWorkspacesComponent } from '../main-sidebar-workspaces/main-sidebar-workspaces.component';

@Component({
  selector: 'app-main-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatTooltipModule,
    WorkspaceCreateModalComponent,
    MainSidebarRecentComponent,
    MainSidebarWorkspacesComponent,
  ],
  templateUrl: './main-sidebar.component.html',
})
export class MainSidebarComponent implements OnInit {
  readonly layoutService = inject(LayoutService);
  readonly workspaceStore = inject(WorkspaceStore);
  readonly authStore = inject(AuthStore);

  // trạng thái mở modal tạo mới Workspace
  readonly isCreateModalOpen = signal<boolean>(false);

  ngOnInit(): void {
    if (this.authStore.isAuthenticated()) {
      this.workspaceStore.loadWorkspaces();
    }
  }

  openCreateModal(): void {
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  // ===== WORKSPACE STATE (Dùng trực tiếp từ WorkspaceStore) =====
  readonly workspaces = computed(() => this.workspaceStore.workspaces().map(toWorkspaceView));
  readonly displayedWorkspaces = computed(() =>
    this.workspaceStore.displayedWorkspaces().map(toWorkspaceView),
  );
}
