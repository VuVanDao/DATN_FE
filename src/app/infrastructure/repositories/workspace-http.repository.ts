import { PagedResult } from '../../shared/models/paged-result.model';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AddWorkspaceMembersRequest,
  AddWorkspaceMembersResult,
  CreateWorkspaceRequest,
  MemberRemovalImpact,
  UpdateWorkspaceRequest,
  Workspace,
  WorkspaceDetail,
  WorkspaceRole,
  WorkspaceMember,
  WorkspaceProject,
} from '../../domain/models/workspace.model';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';
import { ApiResponse } from '../dtos/api-response.dto';
import { WorkspaceDetailResponse, WorkspaceResponse } from '../dtos/workspace.dto';
import { WorkspaceMapper } from '../mappers/workspace.mapper';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceHttpRepository extends WorkspaceRepository {
  private readonly API_URL = `${environment.apiUrl}/workspaces`;
  private readonly http = inject(HttpClient);

  getMembers(id: string, pageIndex: number): Observable<PagedResult<WorkspaceMember>> {
    return this.http
      .get<ApiResponse<PagedResult<WorkspaceMember>>>(`${this.API_URL}/${id}/members`, {
        params: { pageIndex, pageSize: 20 },
      })
      .pipe(map((res) => res.data));
  }

  getProjects(id: string, pageIndex: number): Observable<PagedResult<WorkspaceProject>> {
    return this.http
      .get<ApiResponse<PagedResult<WorkspaceProject>>>(
        `${environment.apiUrl}/Project/workspace-project/${id}`,
        {
          params: { pageIndex, pageSize: 20 },
        },
      )
      .pipe(
        map((res) => ({
          ...res.data,
          items: res.data.items.map(WorkspaceMapper.toWorkspaceProject),
        })),
      );
  }

  getUserWorkspaces(): Observable<Workspace[]> {
    return this.http.get<ApiResponse<WorkspaceResponse[]>>(this.API_URL).pipe(
      map((res) => {
        const items = res.data || [];
        return items.map((item) => WorkspaceMapper.toWorkspace(item));
      }),
    );
  }

  createWorkspace(request: CreateWorkspaceRequest): Observable<Workspace> {
    return this.http
      .post<ApiResponse<WorkspaceResponse>>(this.API_URL, request)
      .pipe(map((res) => WorkspaceMapper.toWorkspace(res.data)));
  }
  getWorkspaceBySlug(slug: string): Observable<WorkspaceDetail> {
    return this.http.get<ApiResponse<WorkspaceDetailResponse>>(`${this.API_URL}/${slug}`).pipe(
      map((res) => {
        return WorkspaceMapper.toWorkspaceDetail(res.data);
      }),
    );
  }
  updateWorkspace(id: string, request: UpdateWorkspaceRequest): Observable<WorkspaceDetail> {
    const formData = new FormData();
    if (request.name !== undefined && request.name !== null) {
      formData.append('name', request.name.trim());
    }
    if (request.description !== undefined && request.description !== null) {
      formData.append('description', request.description.trim());
    }
    if (request.logo) {
      formData.append('logo', request.logo);
    }
    if (request.coverImage) {
      formData.append('coverImage', request.coverImage);
    }
    return this.http
      .put<ApiResponse<WorkspaceDetailResponse>>(`${this.API_URL}/${id}`, formData)
      .pipe(map((res) => WorkspaceMapper.toWorkspaceDetail(res.data)));
  }
  getWorkspaceRoles(): Observable<WorkspaceRole[]> {
    return this.http
      .get<ApiResponse<WorkspaceRole[]>>(`${this.API_URL}/roles`)
      .pipe(map((res) => res.data || []));
  }
  addMembers(
    workspaceId: string,
    request: AddWorkspaceMembersRequest,
  ): Observable<AddWorkspaceMembersResult> {
    return this.http
      .post<ApiResponse<AddWorkspaceMembersResult>>(
        `${this.API_URL}/${workspaceId}/members`,
        request,
      )
      .pipe(map((res) => res.data));
  }

  deleteWorkspace(id: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<boolean>>(`${this.API_URL}/${id}`)
      .pipe(map((res) => res.data));
  }

  getMemberRemovalImpact(workspaceId: string, memberId: string): Observable<MemberRemovalImpact> {
    return this.http
      .get<ApiResponse<MemberRemovalImpact>>(
        `${this.API_URL}/${workspaceId}/members/${memberId}/removal-impact`,
      )
      .pipe(map((res) => res.data));
  }

  removeMember(workspaceId: string, memberId: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<boolean>>(`${this.API_URL}/${workspaceId}/members/${memberId}`)
      .pipe(map((res) => res.data));
  }
}
