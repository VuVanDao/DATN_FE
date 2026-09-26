import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { InviteMembersModalComponent } from './components/invite-members-modal/invite-members-modal.component';
import { WorkspaceDeleteModalComponent } from './components/workspace-delete-modal/workspace-delete-modal.component';
import { CreateProjectModalComponent } from './components/create-project-modal/create-project-modal.component';
import { MemberRemovalModalComponent } from './components/member-removal-modal/member-removal-modal.component';
import { WorkspaceMembersTabComponent } from './components/workspace-members-tab/workspace-members-tab.component';
import { WorkspaceProjectsTabComponent } from './components/workspace-projects-tab/workspace-projects-tab.component';
import { WorkspaceSettingsTabComponent } from './components/workspace-settings-tab/workspace-settings-tab.component';
import { LayoutService } from '../../../../application/layout/layout.service';
import { WorkspaceDetail, WorkspaceMember } from '../../../../domain/models/workspace.model';
import { AuthStore } from '../../../state/auth.store';
import { WorkspaceStore } from '../../../state/workspace.store';

type WorkspaceTab = 'projects' | 'members' | 'settings';

@Component({
  selector: 'app-workspace-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    InviteMembersModalComponent,
    WorkspaceDeleteModalComponent,
    CreateProjectModalComponent,
    MemberRemovalModalComponent,
    WorkspaceProjectsTabComponent,
    WorkspaceMembersTabComponent,
    WorkspaceSettingsTabComponent,
  ],
  templateUrl: './workspace-detail.page.html',
})
export class WorkspaceDetailPage implements OnInit {
  readonly workspaceStore = inject(WorkspaceStore);
  readonly authStore = inject(AuthStore);
  private readonly layoutService = inject(LayoutService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly activeTab = signal<WorkspaceTab>('projects');

  readonly showInviteModal = signal(false);
  readonly showDeleteModal = signal(false);
  readonly showCreateProjectModal = signal(false);
  readonly selectedMemberToRemove = signal<WorkspaceMember | null>(null);
  readonly showMemberRemovalModal = signal(false);

  readonly isOwner = computed(() => {
    const user = this.authStore.currentUser();
    const workspace = this.workspaceStore.currentWorkspace();
    return (
      !!user &&
      !!workspace &&
      workspace.currentUserRole === 'WorkspaceOwner' &&
      workspace.ownerId.toLowerCase() === user.id.toLowerCase()
    );
  });

  readonly isSelfRemoval = computed(() => {
    const userId = this.authStore.currentUser()?.id;
    const memberId = this.selectedMemberToRemove()?.userId;
    return !!userId && !!memberId && userId.toLowerCase() === memberId.toLowerCase();
  });

  ngOnInit(): void {
    this.layoutService.setSidebar('main');
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) this.workspaceStore.getWorkspaceDetail(slug);
    });
  }

  openInviteModal(): void {
    this.showInviteModal.set(true);
  }
  closeInviteModal(): void {
    this.showInviteModal.set(false);
  }
  openDeleteWorkspaceModal(): void {
    this.showDeleteModal.set(true);
  }
  closeDeleteWorkspaceModal(): void {
    this.showDeleteModal.set(false);
  }
  openCreateProjectModal(): void {
    this.showCreateProjectModal.set(true);
  }
  closeCreateProjectModal(): void {
    this.showCreateProjectModal.set(false);
  }

  openRemoveMemberModal(member: WorkspaceMember): void {
    this.selectedMemberToRemove.set(member);
    this.showMemberRemovalModal.set(true);
  }

  closeRemoveMemberModal(): void {
    this.showMemberRemovalModal.set(false);
    this.selectedMemberToRemove.set(null);
  }

  onConfirmDelete(): void {
    const workspace = this.workspaceStore.currentWorkspace();
    if (!workspace) return;
    this.workspaceStore.deleteWorkspace(workspace.id, () => {
      this.closeDeleteWorkspaceModal();
      this.router.navigate(['/workspaces']);
    });
  }

  openLeaveWorkspaceModal(): void {
    const workspace = this.workspaceStore.currentWorkspace();
    const userId = this.authStore.currentUser()?.id;
    const user = this.authStore.currentUser();
    if (!workspace || !user) return;

    const member = workspace.members.find(
      (item) => item.userId.toLowerCase() === userId?.toLowerCase(),
    ) ?? {
      userId: user.id,
      username: user.userName || user.email,
      email: user.email,
      avatarUrl: user.avatarUrl,
      roleId: '',
      roleName: workspace.currentUserRole || 'WorkspaceMember',
      joinAt: new Date().toISOString(),
    };
    if (member) this.openRemoveMemberModal(member);
  }

  onMemberRemoved(event: { memberId: string; workspaceId: string } | string): void {
    const removedId = typeof event === 'string' ? event : event.memberId;
    if (removedId.toLowerCase() === this.authStore.currentUser()?.id.toLowerCase())
      this.router.navigate(['/workspaces']);
  }
}
