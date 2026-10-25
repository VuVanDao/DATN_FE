import { PagedResult } from '../../shared/models/paged-result.model';
import { Observable } from 'rxjs';
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
} from '../models/workspace.model';

export abstract class WorkspaceRepository {
  abstract getMembers(id: string, pageIndex: number): Observable<PagedResult<WorkspaceMember>>;
  abstract getProjects(id: string, pageIndex: number): Observable<PagedResult<WorkspaceProject>>;
  abstract getUserWorkspaces(): Observable<Workspace[]>;
  abstract createWorkspace(request: CreateWorkspaceRequest): Observable<Workspace>;
  abstract getWorkspaceBySlug(slug: string): Observable<WorkspaceDetail>;
  abstract updateWorkspace(
    id: string,
    request: UpdateWorkspaceRequest,
  ): Observable<WorkspaceDetail>;
  abstract getWorkspaceRoles(): Observable<WorkspaceRole[]>;
  abstract addMembers(
    workspaceId: string,
    request: AddWorkspaceMembersRequest,
  ): Observable<AddWorkspaceMembersResult>;
  abstract deleteWorkspace(id: string): Observable<boolean>;

  abstract getMemberRemovalImpact(
    workspaceId: string,
    memberId: string,
  ): Observable<MemberRemovalImpact>;

  abstract removeMember(workspaceId: string, memberId: string): Observable<boolean>;
}
