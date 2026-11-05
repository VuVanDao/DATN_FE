import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { combineLatest, distinctUntilChanged, map } from 'rxjs';
import { SessionService } from '../../../../application/auth/session.service';
import { LayoutService } from '../../../../application/layout/layout.service';
import { NotificationService } from '../../../../application/shared/notification.service';
import { ProjectStore } from '../../../../application/state/project.store';
import { WorkspaceStore } from '../../../../application/state/workspace.store';
import {
  Board,
  Project,
  ProjectMember,
} from '../../../../domain/models/project.model';
import { toProjectView } from '../../../view-models/project.view-model';
import { AddProjectMemberModalComponent } from './components/add-project-member-modal/add-project-member-modal.component';
import { ChangeProjectMemberModalComponent } from './components/change-project-member-modal/change-project-member-modal.component';
import { CreateBoardModalComponent } from './components/create-board-modal/create-board-modal.component';
import { ProjectBoardsComponent } from './components/project-boards/project-boards.component';
import { ProjectHeroHeaderComponent } from './components/project-hero-header/project-hero-header.component';
import { ProjectMembersComponent } from './components/project-members/project-members.component';
import { ProjectSettingsModalComponent } from './components/project-settings-modal/project-settings-modal.component';
import { RemoveProjectMemberModalComponent } from './components/remove-project-member-modal/remove-project-member-modal.component';

@Component({
  selector: 'app-project-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    RouterModule,
    ProjectHeroHeaderComponent,
    ProjectSettingsModalComponent,
    AddProjectMemberModalComponent,
    CreateBoardModalComponent,
    ProjectBoardsComponent,
    ProjectMembersComponent,
    ChangeProjectMemberModalComponent,
    RemoveProjectMemberModalComponent,
  ],
  templateUrl: './project-detail.page.html',
})
export class ProjectDetailPage implements OnInit {
  readonly projectStore = inject(ProjectStore);
  readonly workspaceStore = inject(WorkspaceStore);
  private readonly notifications = inject(NotificationService);
  private readonly session = inject(SessionService);
  private readonly layoutService = inject(LayoutService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private projectKey = '';
  private workspaceId = '';

  readonly routeError = signal<string | null>(null);
  readonly detailError = computed(() => this.routeError() || this.projectStore.error());

  readonly project = computed(() => this.projectStore.currentProject());
  readonly projectView = computed(() => {
    const p = this.project();
    return p ? toProjectView(p) : null;
  });

  readonly boards = computed(() => this.projectStore.boards());
  readonly members = computed(() => this.projectStore.members());
  readonly currentUserId = computed(() => this.session.currentUser()?.id);

  // Check if current user is ProjectLeader
  readonly isCurrentLeader = computed(() => {
    const currentUserId = this.session.currentUser()?.id;
    if (!currentUserId) return false;
    const isMemberLeader = this.members().some(
      (m) =>
        m.userId.toLowerCase() === currentUserId.toLowerCase() && m.roleName === 'ProjectLeader',
    );
    const isRoleLeader = this.project()?.currentUserRole === 'ProjectLeader';
    return isMemberLeader || isRoleLeader;
  });

  // Check if current user is WorkspaceOwner
  readonly isWorkspaceOwner = computed(() => {
    const userId = this.session.currentUser()?.id;
    const project = this.project();
    if (!userId || !project) return false;
    const currentWorkspace = this.workspaceStore.currentWorkspace();
    const workspace =
      currentWorkspace?.id === project.workspaceId
        ? currentWorkspace
        : this.workspaceStore.workspaces().find((item) => item.id === project.workspaceId);
    return workspace?.ownerId.toLowerCase() === userId.toLowerCase();
  });

  // User has authority to change member roles (WorkspaceOwner or ProjectLeader)
  readonly canManageRoles = computed(() => {
    return this.isWorkspaceOwner() || this.isCurrentLeader();
  });

  readonly isMemberActionBusy = computed(
    () =>
      this.projectStore.isRemovingMember() ||
      this.projectStore.isUpdatingMemberRole() ||
      this.projectStore.isUpdatingMemberJobTitle() ||
      this.projectStore.isAddingMember() ||
      this.projectStore.isDeleting(),
  );

  readonly canRemoveMemberBound = (m: ProjectMember) => this.canRemoveMember(m);
  readonly canChangeRoleBound = (m: ProjectMember) => this.canChangeRole(m);

  // Tab điều hướng chính ('boards' | 'members')
  readonly activeMainTab = signal<'boards' | 'members'>('boards');

  // Modals Visibility
  readonly showSettingsModal = signal(false);
  readonly showAddMemberModal = signal(false);
  readonly showCreateBoardModal = signal(false);
  readonly memberToRemove = signal<ProjectMember | null>(null); // Thành viên đang được chọn để xóa
  readonly memberRemovalError = signal<string | null>(null); // Lỗi hiển thị trong hộp xác nhận

  // Đổi vai trò & chức danh thành viên
  readonly memberToChangeRole = signal<ProjectMember | null>(null); // Thành viên đang được chọn để thiết lập
  readonly changeRoleError = signal<string | null>(null); // Lỗi hiển thị trong hộp xác nhận

  ngOnInit(): void {
    this.layoutService.setSidebar('main');
    this.destroyRef.onDestroy(() => this.projectStore.clear());

    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(
        map(([params, query]) => ({
          projectKey: params.get('projectKey')?.trim() || '',
          workspaceId: params.get('workspaceId') || query.get('workspaceId') || '',
        })),
        distinctUntilChanged(
          (previous, current) =>
            previous.projectKey === current.projectKey &&
            previous.workspaceId === current.workspaceId,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ projectKey, workspaceId }) => {
        this.projectKey = projectKey;
        this.workspaceId = workspaceId;
        this.closeSettingsModal();
        this.closeAddMemberModal();
        this.closeCreateBoardModal();
        this.memberToRemove.set(null);
        this.memberRemovalError.set(null);
        this.closeChangeRoleModal();
        this.loadProjectDetail();
      });
  }

  loadProjectDetail(): void {
    this.routeError.set(null);
    if (!this.projectKey || !this.workspaceId) {
      this.projectStore.clear();
      this.routeError.set('Đường dẫn thiếu mã dự án hoặc thông tin workspace.');
      return;
    }

    this.projectStore.getProjectDetail(this.projectKey, this.workspaceId, (project) => {
      if (project.isMember === false) {
        this.notifications.warning('Bạn chưa tham gia dự án này nên không thể vào trang chi tiết.');
        this.goBack();
      }
    });
  }

  // Modals handlers
  openSettingsModal(): void {
    this.showSettingsModal.set(true);
  }

  closeSettingsModal(): void {
    this.showSettingsModal.set(false);
  }

  openAddMemberModal(): void {
    this.showAddMemberModal.set(true);
  }

  closeAddMemberModal(): void {
    this.showAddMemberModal.set(false);
  }

  openCreateBoardModal(): void {
    if (!this.isCurrentLeader()) {
      this.notifications.error('Chỉ Trưởng dự án mới có quyền tạo Bảng mới.');
      return;
    }
    this.showCreateBoardModal.set(true);
  }

  closeCreateBoardModal(): void {
    this.showCreateBoardModal.set(false);
  }

  onProjectUpdated(updated: Project): void {
    this.projectKey = updated.projectKey;
    this.workspaceStore.patchProject(updated);

    const routeWorkspaceId = this.route.snapshot.paramMap.get('workspaceId');
    const commands = routeWorkspaceId
      ? ['/workspaces', routeWorkspaceId, 'projects', updated.projectKey]
      : ['/projects', updated.projectKey];

    if (this.route.snapshot.paramMap.get('projectKey') !== updated.projectKey) {
      void this.router.navigate(commands, {
        queryParamsHandling: 'preserve',
        replaceUrl: true,
      });
    }
  }

  onProjectDeleted(project: Project): void {
    this.closeSettingsModal(); // đóng modal settings project
    this.workspaceStore.onProjectDeleted(project.workspaceId);
    this.goBack();
  }

  isSelf(member: ProjectMember): boolean {
    return member.userId.toLowerCase() === this.session.currentUser()?.id.toLowerCase();
  }

  canRemoveMember(member: ProjectMember): boolean {
    // hàm xác định xem người dùng hiện tại có quyền xóa thành viên dự án hay không
    const userId = this.session.currentUser()?.id;
    const project = this.project();
    if (!userId || !project || member.roleName === 'ProjectLeader') return false;
    const currentWorkspace = this.workspaceStore.currentWorkspace();
    const workspace =
      currentWorkspace?.id === project.workspaceId
        ? currentWorkspace
        : this.workspaceStore.workspaces().find((item) => item.id === project.workspaceId);
    const isOwner = workspace?.ownerId.toLowerCase() === userId.toLowerCase();
    const isLeader = this.members().some(
      (item) =>
        item.userId.toLowerCase() === userId.toLowerCase() && item.roleName === 'ProjectLeader',
    );
    return isOwner || isLeader || this.isSelf(member);
  }

  openRemoveMember(member: ProjectMember): void {
    // mở hộp xác nhận xóa thành viên dự án
    if (!this.canRemoveMember(member) || this.projectStore.isRemovingMember()) return;
    this.memberRemovalError.set(null);
    this.memberToRemove.set(member);
  }

  closeRemoveMember(): void {
    // đóng hộp xác nhận xóa thành viên dự án
    if (this.projectStore.isRemovingMember()) return;
    this.memberToRemove.set(null);
    this.memberRemovalError.set(null);
  }

  confirmRemoveMember(): void {
    // xác nhận xóa thành viên dự án
    const member = this.memberToRemove();
    const project = this.project();
    if (!member || !project || !this.canRemoveMember(member)) return;
    const isSelf = this.isSelf(member);
    this.memberRemovalError.set(null);
    this.projectStore.removeMember(
      project.id,
      member.userId,
      () => {
        this.memberToRemove.set(null);
        this.memberRemovalError.set(null);
        this.workspaceStore.onProjectMemberRemoved(project.workspaceId);
        if (isSelf) {
          this.projectStore.clear();
          this.goBack();
        }
      },
      (message) => this.memberRemovalError.set(message),
    );
  }

  canChangeRole(member: ProjectMember): boolean {
    if (!this.canManageRoles()) return false;
    // Không thể tự đổi role của chính mình nếu đang là ProjectLeader (cần chọn thành viên khác để chuyển giao)
    if (this.isSelf(member) && member.roleName === 'ProjectLeader') return false;
    return true;
  }

  openChangeRoleModal(member: ProjectMember): void {
    if (
      !this.canChangeRole(member) ||
      this.projectStore.isUpdatingMemberRole() ||
      this.projectStore.isUpdatingMemberJobTitle()
    )
      return;
    this.projectStore.loadRoles();
    this.changeRoleError.set(null);
    this.memberToChangeRole.set(member);
  }

  closeChangeRoleModal(force = false): void {
    if (
      !force &&
      (this.projectStore.isUpdatingMemberRole() || this.projectStore.isUpdatingMemberJobTitle())
    )
      return;
    this.memberToChangeRole.set(null);
    this.changeRoleError.set(null);
  }

  confirmChangeRole(payload: { newRoleId: string | null; jobTitle: string }): void {
    const member = this.memberToChangeRole();
    const project = this.project();
    const newRoleId = payload.newRoleId;
    const jobTitle = payload.jobTitle.trim();
    if (
      !member ||
      !project ||
      this.projectStore.isUpdatingMemberRole() ||
      this.projectStore.isUpdatingMemberJobTitle()
    )
      return;

    const roleChanged = !!newRoleId && newRoleId !== member.roleId;
    const titleChanged = jobTitle !== (member.jobTitle ?? '').trim();

    if (!roleChanged && !titleChanged) return;
    this.changeRoleError.set(null);

    if (roleChanged && titleChanged) {
      this.projectStore.updateMemberRole(
        project.id,
        member.userId,
        { newRoleId: newRoleId! },
        () => {
          this.projectStore.updateMemberJobTitle(
            project.id,
            member.userId,
            { jobTitle: jobTitle || null },
            () => this.closeChangeRoleModal(true),
            (err) => this.changeRoleError.set(err),
          );
        },
        (message) => this.changeRoleError.set(message),
      );
      return;
    }

    if (roleChanged) {
      this.projectStore.updateMemberRole(
        project.id,
        member.userId,
        { newRoleId: newRoleId! },
        () => this.closeChangeRoleModal(true),
        (message) => this.changeRoleError.set(message),
      );
      return;
    }

    if (titleChanged) {
      this.projectStore.updateMemberJobTitle(
        project.id,
        member.userId,
        { jobTitle: jobTitle || null },
        () => this.closeChangeRoleModal(true),
        (message) => this.changeRoleError.set(message),
      );
    }
  }

  goBack(): void {
    const workspace = this.workspaceStore.currentWorkspace();
    const slug =
      this.route.snapshot.queryParamMap.get('workspaceSlug') ||
      (workspace?.id === this.workspaceId ? workspace.slug : null);

    if (slug) {
      void this.router.navigate(['/workspaces', slug]);
      return;
    }

    void this.router.navigate(['/workspaces']);
  }

  onBoardClick(board: Board): void {
    void this.router.navigate(['/boards', board.slug], {
      queryParams: { projectId: board.projectId },
    });
  }

  onTogglePin(board: Board): void {
    this.projectStore.toggleBoardPin(board);
  }
}
