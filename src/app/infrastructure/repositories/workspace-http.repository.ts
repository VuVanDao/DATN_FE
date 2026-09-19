import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';
import {
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  Workspace,
  WorkspaceDetail,
  WorkspaceDetailResponse,
  WorkspaceResponse,
} from '../../domain/models/workspace.model';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../dtos/auth.dto';
import { WorkspaceMapper } from '../mappers/workspace.mapper';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceHttpRepository extends WorkspaceRepository {
  private readonly API_URL = `${environment.apiUrl}/workspaces`;
  private readonly http = inject(HttpClient);

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
}
