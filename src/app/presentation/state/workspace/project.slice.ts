import { inject, Injectable } from '@angular/core';
import { CreateProjectRequest } from '../../../domain/models/project.model';
import { CreateProjectUseCase } from '../../../application/project/create-project.use-case';
import { toast } from 'ngx-sonner';
import { runStoreRequest } from '../store-request.util';
import { LoadingFlags } from '../loading-flags.util';
import { WorkspaceDetailSlice } from './workspace-detail.slice';

/**
 * Concern: dự án thuộc workspace.
 *
 * Hiện chỉ có thao tác tạo dự án trong ngữ cảnh workspace đang mở, nên tạm đặt
 * cạnh các slice workspace. Khi nghiệp vụ project lớn hơn (danh sách, sửa, xoá,
 * board...), slice này nên được nâng thành `ProjectStore` độc lập.
 */
@Injectable({
  providedIn: 'root',
})
export class ProjectSlice {
  private readonly _createProjectUseCase = inject(CreateProjectUseCase);
  private readonly _detail = inject(WorkspaceDetailSlice);

  private readonly _loading = new LoadingFlags();

  private readonly _isCreatingProject = this._loading.create('createProject');

  readonly isCreatingProject = this._isCreatingProject.asReadonly();

  createProject(request: CreateProjectRequest, onSuccess?: () => void): void {
    runStoreRequest({
      loading: this._isCreatingProject,
      request$: this._createProjectUseCase.execute(request),
      fallbackErrorMessage: 'Tạo dự án thất bại, vui lòng thử lại.',
      onSuccess: (res) => {
        toast.success(`Dự án "${res.name}" đã được tạo thành công`);
        // Tải lại chi tiết workspace để tab Dự án có dữ liệu mới
        const currentSlug = this._detail.currentWorkspace()?.slug;
        if (currentSlug) {
          this._detail.getWorkspaceDetail(currentSlug);
        }
        onSuccess?.();
      },
    });
  }

  clear(): void {
    this._loading.resetAll();
  }
}
