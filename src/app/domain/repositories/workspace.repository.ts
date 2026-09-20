import { Observable } from 'rxjs';
import {
  AddWorkspaceMembersRequest,
  AddWorkspaceMembersResponse,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  Workspace,
  WorkspaceDetail,
  WorkspaceRole,
} from '../models/workspace.model';

export abstract class WorkspaceRepository {
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
  ): Observable<AddWorkspaceMembersResponse>;
}
