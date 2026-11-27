import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { LayoutService } from '../../../layouts/layout.service';
import { AuthStore } from '../../../../application/state/auth.store';
import { WorkspaceStore } from '../../../../application/state/workspace.store';
import { UpdateWorkspaceRequest, WorkspaceMember } from '../../../../domain/models/workspace.model';
import { toWorkspaceDetailView } from '../../../view-models/workspace.view-model';
import { CreateProjectModalComponent } from './components/create-project-modal/create-project-modal.component';
import { InviteMembersModalComponent } from './components/invite-members-modal/invite-members-modal.component';
import { MemberRemovalModalComponent } from './components/member-removal-modal/member-removal-modal.component';
import { WorkspaceDeleteModalComponent } from './components/workspace-delete-modal/workspace-delete-modal.component';
import { WorkspaceMembersTabComponent } from './components/workspace-members-tab/workspace-members-tab.component';
import { WorkspaceProjectsTabComponent } from './components/workspace-projects-tab/workspace-projects-tab.component';
import { WorkspaceSettingsTabComponent } from './components/workspace-settings-tab/workspace-settings-tab.component';

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

  private readonly destroyRef = inject(DestroyRef);
  readonly workspace = computed(() => {
    const workspace = this.workspaceStore.currentWorkspace();
    return workspace
      ? toWorkspaceDetailView(workspace, this.workspaceStore.projects.items())
      : null;
  });
  readonly tabs: { id: WorkspaceTab; label: string }[] = [
    { id: 'projects', label: 'Dự án' },
    { id: 'members', label: 'Thành viên' },
    { id: 'settings', label: 'Cài đặt' },
  ];
  readonly activeTab = signal<WorkspaceTab>('projects');
  readonly routeSlug = signal('');
  @ViewChild(WorkspaceSettingsTabComponent) private settingsTab?: WorkspaceSettingsTabComponent;

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
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.closeInviteModal();
      this.closeDeleteWorkspaceModal();
      this.closeCreateProjectModal();
      this.closeRemoveMemberModal();

      const slug = params.get('slug');
      this.activeTab.set('projects');
      this.routeSlug.set(slug ?? '');
      if (slug) this.workspaceStore.getWorkspaceDetail(slug);
    });
  }

  selectTab(tab: WorkspaceTab): void {
    this.activeTab.set(tab);
    this.workspaceStore.selectTab(tab);
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
    this.workspaceStore.clearMemberRemovalImpact();
  }

  saveWorkspace(request: UpdateWorkspaceRequest): void {
    const workspace = this.workspaceStore.currentWorkspace();
    if (!workspace || !this.isOwner()) return;
    const originalSlug = workspace.slug;
    this.workspaceStore.updateWorkspace(workspace.id, request, (updated) => {
      this.settingsTab?.resetSavedForm();
      if (this.routeSlug() === originalSlug && updated.slug !== originalSlug) {
        void this.router.navigate(['/workspaces', updated.slug], { replaceUrl: true });
      }
    });
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

    const member = this.workspaceStore.members
      .items()
      .find((item) => item.userId.toLowerCase() === userId?.toLowerCase()) ?? {
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

  goToHome(): void {
    void this.router.navigate(['/home-page']);
  }

  goToWorkspaces(): void {
    void this.router.navigate(['/workspaces']);
  }
}
