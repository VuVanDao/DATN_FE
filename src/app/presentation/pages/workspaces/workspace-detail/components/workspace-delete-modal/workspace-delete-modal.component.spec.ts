import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { WorkspaceDeleteModalComponent } from './workspace-delete-modal.component';
import { WorkspaceDetail } from '../../../../../../domain/models/workspace.model';

const workspace: WorkspaceDetail = {
  id: 'workspace',
  slug: 'workspace',
  name: 'Workspace',
  ownerId: 'owner',
  ownerName: 'Owner',
  createdAt: '',
  memberPreview: [],
  membersCount: 0,
};

describe('Workspace deletion confirmation', () => {
  it('checks the entered name again when confirming and when the workspace changes', () => {
    TestBed.configureTestingModule({ imports: [WorkspaceDeleteModalComponent] });
    const fixture = TestBed.createComponent(WorkspaceDeleteModalComponent);
    fixture.componentRef.setInput('workspace', workspace);
    fixture.componentRef.setInput('isOpen', true);
    const component = fixture.componentInstance;
    const confirmed = vi.fn();
    component.confirmed.subscribe(confirmed);
    component.confirm();
    expect(confirmed).not.toHaveBeenCalled();
    component.confirmNameInput.set('Workspace');
    component.confirm();
    expect(confirmed).toHaveBeenCalledOnce();
    fixture.componentRef.setInput('workspace', {
      ...workspace,
      id: 'other',
      name: 'Other workspace',
    });
    component.confirm();
    expect(confirmed).toHaveBeenCalledOnce();
    component.confirmNameInput.set('Other workspace');
    fixture.componentRef.setInput('isDeleting', true);
    component.confirm();
    expect(confirmed).toHaveBeenCalledOnce();
  });
});
