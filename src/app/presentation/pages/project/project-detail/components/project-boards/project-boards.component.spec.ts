import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { ProjectBoardsComponent } from './project-boards.component';

describe('ProjectBoardsComponent', () => {
  let fixture: ComponentFixture<ProjectBoardsComponent>;
  let component: ProjectBoardsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectBoardsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectBoardsComponent);
    component = fixture.componentInstance;
  });

  it('should not show "+ Tạo bảng mới" button when canCreateBoard is false', () => {
    fixture.componentRef.setInput('canCreateBoard', false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    const hasCreateButton = Array.from(buttons).some((b) =>
      b.textContent?.includes('Tạo bảng mới'),
    );
    expect(hasCreateButton).toBe(false);
  });

  it('should show "+ Tạo bảng mới" button and emit createBoard when canCreateBoard is true', () => {
    fixture.componentRef.setInput('canCreateBoard', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    const createBtn = Array.from(buttons).find((b) => b.textContent?.includes('Tạo bảng mới'));
    expect(createBtn).toBeDefined();

    const createSpy = vi.fn();
    component.createBoard.subscribe(createSpy);
    createBtn?.click();
    expect(createSpy).toHaveBeenCalled();
  });

  it('should not show empty state create button when canCreateBoard is false', () => {
    fixture.componentRef.setInput('canCreateBoard', false);
    fixture.componentRef.setInput('boards', []);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    const hasCreateButton = Array.from(buttons).some((b) =>
      b.textContent?.includes('Tạo bảng mới'),
    );
    expect(hasCreateButton).toBe(false);
  });
});
