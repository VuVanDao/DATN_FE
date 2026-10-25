import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { WorkspaceSettingsTabComponent } from './workspace-settings-tab.component';
import { WorkspaceDetailView } from '../../../../../view-models/workspace.view-model';

function workspace(id: string): WorkspaceDetailView {
  return {
    id,
    slug: id,
    name: 'Workspace ' + id,
    ownerId: 'owner',
    ownerName: 'Owner',
    createdAt: '',
    members: [],
    projects: [],
    initial: 'W',
    color: '',
  };
}

describe('Workspace settings form', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [WorkspaceSettingsTabComponent] }));

  it('keeps unsaved edits when membership changes and clears them when switching workspace', () => {
    const fixture = TestBed.createComponent(WorkspaceSettingsTabComponent);
    const initial = workspace('a');
    fixture.componentRef.setInput('workspace', initial);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.form.controls.name.setValue('Unsaved name');
    component.form.markAsDirty();
    component.logoFile.setValue(new File(['image'], 'logo.png', { type: 'image/png' }));
    fixture.componentRef.setInput('workspace', { ...initial, members: [] });
    fixture.detectChanges();
    expect(component.form.controls.name.value).toBe('Unsaved name');
    expect(component.logoFile.value?.name).toBe('logo.png');
    fixture.componentRef.setInput('workspace', workspace('b'));
    fixture.detectChanges();
    expect(component.form.controls.name.value).toBe('Workspace b');
    expect(component.logoFile.value).toBeNull();
    expect(component.form.pristine).toBe(true);
  });

  it('emits valid edits to its parent and blocks duplicate saves', () => {
    const fixture = TestBed.createComponent(WorkspaceSettingsTabComponent);
    fixture.componentRef.setInput('workspace', workspace('a'));
    fixture.componentRef.setInput('isOwner', true);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const save = vi.fn();
    component.saveWorkspace.subscribe(save);
    component.form.controls.name.setValue('Updated name');
    component.submitUpdateForm();
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated name' }));
    fixture.componentRef.setInput('isSaving', true);
    fixture.detectChanges();
    component.submitUpdateForm();
    expect(save).toHaveBeenCalledOnce();
  });
});
