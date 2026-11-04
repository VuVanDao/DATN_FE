import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AddProjectMembersRequest,
  Board,
  CreateBoardRequest,
  CreateProjectRequest,
  Project,
  ProjectMember,
  ProjectRole,
  UpdateProjectMemberRoleRequest,
  UpdateProjectMemberJobTitleRequest,
  UpdateProjectRequest,
} from '../../domain/models/project.model';
import { ProjectRepository } from '../../domain/repositories/project.repository';
import { ApiResponse } from '../dtos/api-response.dto';

@Injectable({
  providedIn: 'root',
})
export class ProjectHttpRepository implements ProjectRepository {
  private readonly projectUrl = `${environment.apiUrl}/project`;
  private readonly boardUrl = `${environment.apiUrl}/board`;
  private readonly http = inject(HttpClient);

  createProject(request: CreateProjectRequest): Observable<Project> {
    return this.http
      .post<ApiResponse<Project>>(this.projectUrl, request)
      .pipe(map((res) => res.data));
  }

  getProjectDetail(projectKey: string, workspaceId: string): Observable<Project> {
    return this.http
      .get<ApiResponse<Project>>(`${this.projectUrl}/${projectKey}/workspace/${workspaceId}`)
      .pipe(map((res) => res.data));
  }

  updateProject(projectId: string, request: UpdateProjectRequest): Observable<Project> {
    return this.http
      .put<ApiResponse<Project>>(`${this.projectUrl}/${projectId}`, request)
      .pipe(map((res) => res.data));
  }

  deleteProject(projectId: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<boolean>>(`${this.projectUrl}/${projectId}`)
      .pipe(map((res) => res.data));
  }

  getProjectMembers(projectId: string): Observable<ProjectMember[]> {
    return this.http
      .get<ApiResponse<ProjectMember[]>>(`${this.projectUrl}/${projectId}/members`)
      .pipe(map((res) => res.data));
  }

  addProjectMembers(
    projectId: string,
    request: AddProjectMembersRequest,
  ): Observable<ProjectMember[]> {
    return this.http
      .post<ApiResponse<ProjectMember[]>>(`${this.projectUrl}/${projectId}/members`, request)
      .pipe(map((res) => res.data));
  }

  removeProjectMember(projectId: string, userId: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<boolean>>(`${this.projectUrl}/${projectId}/members/${userId}`)
      .pipe(map((res) => res.data));
  }

  updateProjectMemberRole(
    projectId: string,
    userId: string,
    request: UpdateProjectMemberRoleRequest,
  ): Observable<ProjectMember> {
    return this.http
      .put<ApiResponse<ProjectMember>>(
        `${this.projectUrl}/${projectId}/members/${userId}/role`,
        request,
      )
      .pipe(map((res) => res.data));
  }

  updateProjectMemberJobTitle(
    projectId: string,
    userId: string,
    request: UpdateProjectMemberJobTitleRequest,
  ): Observable<ProjectMember> {
    return this.http
      .put<ApiResponse<ProjectMember>>(
        `${this.projectUrl}/${projectId}/members/${userId}/job-title`,
        request,
      )
      .pipe(map((res) => res.data));
  }

  getProjectRoles(): Observable<ProjectRole[]> {
    return this.http
      .get<ApiResponse<ProjectRole[]>>(`${this.projectUrl}/roles`)
      .pipe(map((res) => res.data));
  }

  getProjectBoards(projectId: string): Observable<Board[]> {
    return this.http
      .get<ApiResponse<Board[]>>(`${this.boardUrl}/project/${projectId}`)
      .pipe(map((res) => res.data));
  }

  createBoard(request: CreateBoardRequest): Observable<Board> {
    // If request.type is string 'Kanban' or 'Scrum', map to enum number (Kanban=1, Scrum=2) for BE
    const payload = {
      ...request,
      type: typeof request.type === 'string' ? (request.type === 'Scrum' ? 1 : 0) : request.type,
    };
    return this.http.post<ApiResponse<Board>>(this.boardUrl, payload).pipe(map((res) => res.data));
  }
}
