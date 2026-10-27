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
import { Board, Project, ProjectMember } from '../../../../domain/models/project.model';
import {
  getBoardBadgeColor,
  getBoardIcon,
  toProjectView,
} from '../../../view-models/project.view-model';
import { AddProjectMemberModalComponent } from './components/add-project-member-modal/add-project-member-modal.component';
import { CreateBoardModalComponent } from './components/create-board-modal/create-board-modal.component';
import { ProjectSettingsModalComponent } from './components/project-settings-modal/project-settings-modal.component';

type BoardFilterTab = 'all' | 'Kanban' | 'Scrum';

@Component({
  selector: 'app-project-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    RouterModule,
    ProjectSettingsModalComponent,
    AddProjectMemberModalComponent,
    CreateBoardModalComponent,
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

  // Search & Filter Tabs
  readonly searchQuery = signal('');
  readonly activeBoardTab = signal<BoardFilterTab>('all');
  readonly memberSearch = signal('');

  // Filtered members list
  readonly filteredMembers = computed(() => {
    const list = this.members();
    const query = this.memberSearch().trim().toLowerCase();
    if (!query) return list;
    return list.filter(
      (m) =>
        m.username.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query),
    );
  });

  // Check if current user is ProjectLeader
  readonly isCurrentLeader = computed(() => {
    const currentUserId = this.session.currentUser()?.id;
    if (!currentUserId) return false;
    return this.members().some(
      (m) =>
        m.userId.toLowerCase() === currentUserId.toLowerCase() &&
        m.roleName === 'ProjectLeader',
    );
  });

  // Filtered boards list
  readonly filteredBoards = computed(() => {
    const list = this.boards();
    const query = this.searchQuery().trim().toLowerCase();
    const tab = this.activeBoardTab();

    return list.filter((board) => {
      const matchTab = tab === 'all' || board.type.toLowerCase() === tab.toLowerCase();
      const matchQuery =
        !query ||
        board.title.toLowerCase().includes(query) ||
        board.slug.toLowerCase().includes(query);
      return matchTab && matchQuery;
    });
  });

  readonly kanbanCount = computed(
    () => this.boards().filter((b) => b.type.toLowerCase().includes('kanban')).length,
  );
  readonly scrumCount = computed(
    () => this.boards().filter((b) => b.type.toLowerCase().includes('scrum')).length,
  );

  // Modals Visibility
  readonly showSettingsModal = signal(false);
  readonly showAddMemberModal = signal(false);
  readonly showCreateBoardModal = signal(false);
  readonly memberToRemove = signal<ProjectMember | null>(null); // Thành viên đang được chọn để xóa
  readonly memberRemovalError = signal<string | null>(null); // Lỗi hiển thị trong hộp xác nhận

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
        this.searchQuery.set('');
        this.memberSearch.set('');
        this.activeBoardTab.set('all');
        this.closeSettingsModal();
        this.closeAddMemberModal();
        this.closeCreateBoardModal();
        this.memberToRemove.set(null);
        this.memberRemovalError.set(null);
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

  setBoardTab(tab: BoardFilterTab): void {
    this.activeBoardTab.set(tab);
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

  // Helpers
  getBoardIconName(type: string): string {
    return getBoardIcon(type);
  }

  getBoardBadge(type: string) {
    return getBoardBadgeColor(type);
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
    // Navigate to board view if route exists
    void this.router.navigate(['/boards', board.slug]);
  }
}
