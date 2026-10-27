import { inject, Injectable, OnDestroy } from '@angular/core';
import { WorkspaceMember } from '../../domain/models/workspace.model';
import { PagedListState } from '../state/paged-list-state.util';
import { StoreRequestRunner } from '../state/store-request.util';
import { GetWorkspaceMembersUseCase } from '../workspace/get-workspace-members.use-case';

/** Scoped to the modal so direct project links do not depend on workspace tab caches. */
@Injectable()
export class ProjectMemberPickerStore implements OnDestroy {
  private readonly getMembers = inject(GetWorkspaceMembersUseCase);
  readonly members = new PagedListState<WorkspaceMember>(inject(StoreRequestRunner), (id, page) =>
    this.getMembers.execute(id, page),
  );

  ngOnDestroy(): void {
    this.members.clear();
  }
}
