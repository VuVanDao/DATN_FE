import { Observable } from 'rxjs';
import {
  AddProjectMembersRequest,
  Board,
  CreateBoardRequest,
  CreateProjectRequest,
  Project,
  ProjectMember,
  ProjectRole,
  UpdateProjectMemberRoleRequest,
  UpdateProjectRequest,
} from '../models/project.model';

export abstract class ProjectRepository {
  abstract createProject(request: CreateProjectRequest): Observable<Project>;
  abstract getProjectDetail(projectKey: string, workspaceId: string): Observable<Project>;
  abstract updateProject(projectId: string, request: UpdateProjectRequest): Observable<Project>;
  abstract deleteProject(projectId: string): Observable<boolean>;
  abstract getProjectMembers(projectId: string): Observable<ProjectMember[]>;
  abstract addProjectMembers(
    projectId: string,
    request: AddProjectMembersRequest,
  ): Observable<ProjectMember[]>;
  abstract removeProjectMember(projectId: string, userId: string): Observable<boolean>;
  abstract updateProjectMemberRole(
    projectId: string,
    userId: string,
    request: UpdateProjectMemberRoleRequest,
  ): Observable<ProjectMember>;
  abstract getProjectRoles(): Observable<ProjectRole[]>;
  abstract getProjectBoards(projectId: string): Observable<Board[]>;
  abstract createBoard(request: CreateBoardRequest): Observable<Board>;
}
