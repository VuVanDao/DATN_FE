import { Observable } from 'rxjs';
import { CreateWorkspaceRequest, Workspace } from '../models/workspace.model';

export abstract class WorkspaceRepository {
  abstract getUserWorkspaces(): Observable<Workspace[]>;
  abstract createWorkspace(request: CreateWorkspaceRequest): Observable<Workspace>;
}
