import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthLeftComponent } from './auth-left.component';

describe('AuthLeftComponent', () => {
  let component: AuthLeftComponent;
  let fixture: ComponentFixture<AuthLeftComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthLeftComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthLeftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should default isRecoveryMode to false and show Kanban illustration text', () => {
    expect(component.isRecoveryMode()).toBe(false);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Điều phối cả đội');
    expect(compiled.textContent).toContain('Bug');
    expect(compiled.textContent).toContain('Task');
    expect(compiled.textContent).toContain('Story');
    expect(compiled.textContent).toContain('Epic');
  });

  it('should show recovery illustration text when isRecoveryMode is true', () => {
    fixture.componentRef.setInput('isRecoveryMode', true);
    fixture.detectChanges();

    expect(component.isRecoveryMode()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Quên mật khẩu không sao');
  });
});
