import { inject, Injectable } from '@angular/core';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';
import { Observable } from 'rxjs';
import { MemberRemovalImpact } from '../../domain/models/workspace.model';

@Injectable({
  providedIn: 'root',
})
export class GetMemberRemovalImpactUseCase {
  private readonly _workspaceRepository = inject(WorkspaceRepository);
  execute = (workspaceId: string, memberId: string): Observable<MemberRemovalImpact> => {
    // Gọi phương thức tương ứng từ repository
    return this._workspaceRepository.getMemberRemovalImpact(workspaceId, memberId);
  };
}
