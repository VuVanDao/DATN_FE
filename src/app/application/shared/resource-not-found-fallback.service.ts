import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BoardStore } from '../state/board.store';
import { ProjectStore } from '../state/project.store';
import { WorkspaceStore } from '../state/workspace.store';
import { NotificationService } from './notification.service';

/**
 * Service xử lý tập trung khi tài nguyên mục tiêu (Workspace, Project, Board, Card)
 * không tìm thấy hoặc đã bị xóa (HTTP 404).
 *
 * Tự động đồng bộ dọn dẹp state và điều hướng người dùng về trang cấp cha an toàn.
 */
@Injectable({
  providedIn: 'root',
})
export class ResourceNotFoundFallbackService {
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly projectStore = inject(ProjectStore);
  private readonly boardStore = inject(BoardStore);

  private isRedirecting = false;

  handle(error: HttpErrorResponse, req: HttpRequest<unknown>): boolean {
    if (this.isRedirecting) return true;

    const message = (error.error?.message || '').toLowerCase();
    const currentUrl = this.router.url;
    const reqUrl = req.url.toLowerCase();

    // 1. Kiểm tra trường hợp Thẻ (Card) không tồn tại (xảy ra khi đang ở Board)
    if (
      currentUrl.includes('/boards/') &&
      (reqUrl.includes('/cards') || message.includes('card') || message.includes('thẻ'))
    ) {
      const cardIdMatch = reqUrl.match(/\/cards\/([a-zA-Z0-9-]+)/);
      if (cardIdMatch && cardIdMatch[1]) {
        this.boardStore.removeCardLocally(cardIdMatch[1]);
      } else {
        this.boardStore.clearCardDetail();
      }
      this.notifications.warning('Thẻ công việc này không còn tồn tại hoặc đã bị xóa.');
      return true;
    }

    // 2. Kiểm tra trường hợp Bảng (Board) không tồn tại
    if (
      currentUrl.includes('/boards/') &&
      (reqUrl.includes('/board') || message.includes('board') || message.includes('bảng'))
    ) {
      this.isRedirecting = true;
      const currentBoard = this.boardStore.currentBoard();
      const currentProject = this.projectStore.currentProject();

      const workspaceId = currentBoard?.workspaceId || currentProject?.workspaceId;
      const projectKey = currentBoard?.projectKey || currentProject?.projectKey;

      this.boardStore.clear();
      this.notifications.warning('Bảng công việc này không còn tồn tại hoặc đã bị xóa.');

      setTimeout(() => {
        if (workspaceId && projectKey) {
          void this.router
            .navigate(['/workspaces', workspaceId, 'projects', projectKey])
            .finally(() => (this.isRedirecting = false));
        } else if (projectKey) {
          void this.router
            .navigate(['/projects', projectKey])
            .finally(() => (this.isRedirecting = false));
        } else {
          void this.router.navigate(['/workspaces']).finally(() => (this.isRedirecting = false));
        }
      }, 100);
      return true;
    }

    // 3. Kiểm tra trường hợp Dự án (Project) không tồn tại
    if (
      (currentUrl.includes('/projects/') ||
        (currentUrl.includes('/boards/') && (message.includes('project') || message.includes('dự án')))) &&
      (reqUrl.includes('/project') || message.includes('project') || message.includes('dự án'))
    ) {
      this.isRedirecting = true;
      const currentProject = this.projectStore.currentProject();
      const currentWorkspace = this.workspaceStore.currentWorkspace();
      const workspaceSlug = currentWorkspace?.slug;

      this.projectStore.clear();
      this.notifications.warning('Dự án này không còn tồn tại hoặc đã bị xóa.');

      setTimeout(() => {
        if (workspaceSlug) {
          void this.router
            .navigate(['/workspaces', workspaceSlug])
            .finally(() => (this.isRedirecting = false));
        } else if (currentProject?.workspaceId) {
          void this.router
            .navigate(['/workspaces', currentProject.workspaceId])
            .finally(() => (this.isRedirecting = false));
        } else {
          void this.router.navigate(['/workspaces']).finally(() => (this.isRedirecting = false));
        }
      }, 100);
      return true;
    }

    // 4. Kiểm tra trường hợp Không gian làm việc (Workspace) không tồn tại
    if (
      currentUrl.includes('/workspaces/') &&
      (reqUrl.includes('/workspaces') ||
        message.includes('workspace') ||
        message.includes('không gian làm việc'))
    ) {
      this.isRedirecting = true;
      const currentWorkspace = this.workspaceStore.currentWorkspace();
      if (currentWorkspace?.id) {
        this.workspaceStore.removeWorkspaceLocally(currentWorkspace.id);
      }
      this.workspaceStore.clearDetail();
      this.notifications.warning('Không gian làm việc này không còn tồn tại hoặc đã bị xóa.');

      setTimeout(() => {
        void this.router.navigate(['/workspaces']).finally(() => (this.isRedirecting = false));
      }, 100);
      return true;
    }

    return false;
  }
}
