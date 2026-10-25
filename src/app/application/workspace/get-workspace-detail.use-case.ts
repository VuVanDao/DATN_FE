import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkspaceDetail } from '../../domain/models/workspace.model';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';

@Injectable({
  providedIn: 'root',
})
export class GetWorkspaceDetailUseCase {
  private readonly _workspaceRepository = inject(WorkspaceRepository);

  execute(slug: string): Observable<WorkspaceDetail> {
    return this._workspaceRepository.getWorkspaceBySlug(slug);
  }
}
