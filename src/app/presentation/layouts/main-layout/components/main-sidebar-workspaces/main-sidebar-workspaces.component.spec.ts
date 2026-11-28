import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { MainSidebarWorkspacesComponent } from './main-sidebar-workspaces.component';

describe('MainSidebarWorkspacesComponent', () => {
  let component: MainSidebarWorkspacesComponent;
  let fixture: ComponentFixture<MainSidebarWorkspacesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainSidebarWorkspacesComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MainSidebarWorkspacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
