import { inject, Injectable } from '@angular/core';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';
import { Observable } from 'rxjs';
import { WorkspaceDetail } from '../../domain/models/workspace.model';

@Injectable({
  providedIn: 'root',
})
export class GetWorkspaceDetailUseCase {
  private readonly _workspaceRepository = inject(WorkspaceRepository);
  execute(slug: string): Observable<WorkspaceDetail> {
    return this._workspaceRepository.getWorkspaceBySlug(slug);
  }
}
