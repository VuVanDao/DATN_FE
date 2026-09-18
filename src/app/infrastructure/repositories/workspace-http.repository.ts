import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';
import { CreateWorkspaceRequest, Workspace, WorkspaceResponse } from '../../domain/models/workspace.model';
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
    return this.http.post<ApiResponse<WorkspaceResponse>>(this.API_URL, request).pipe(
      map((res) => WorkspaceMapper.toWorkspace(res.data)),
    );
  }
}
