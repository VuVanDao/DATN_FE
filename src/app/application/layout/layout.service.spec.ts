import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LayoutService } from './layout.service';

describe('LayoutService', () => {
  let service: LayoutService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [LayoutService],
    });
    service = TestBed.inject(LayoutService);
  });

  it('should initialize with default values', () => {
    expect(service.isSidebarCollapsed()).toBe(false);
    expect(service.activeSidebar()).toBe('main');
    expect(service.isFullBleed()).toBe(false);
    expect(service.isAiDrawerOpen()).toBe(false);
  });

  it('should toggle sidebar and persist state to localStorage', () => {
    service.toggleSidebar();
    expect(service.isSidebarCollapsed()).toBe(true);
    expect(localStorage.getItem('datn_sidebar_collapsed')).toBe('true');

    service.toggleSidebar();
    expect(service.isSidebarCollapsed()).toBe(false);
    expect(localStorage.getItem('datn_sidebar_collapsed')).toBe('false');
  });

  it('should not reset isSidebarCollapsed when setSidebar is called', () => {
    service.setSidebarCollapsed(true);
    expect(service.isSidebarCollapsed()).toBe(true);

    service.setSidebar('main');
    expect(service.activeSidebar()).toBe('main');
    // Crucial: should remain collapsed across route changes / setSidebar
    expect(service.isSidebarCollapsed()).toBe(true);

    service.setSidebar('admin');
    expect(service.activeSidebar()).toBe('admin');
    expect(service.isSidebarCollapsed()).toBe(true);
  });

  it('should restore persisted preference when restoreSidebarPreference is called', () => {
    // Persist collapsed = false
    service.setSidebarCollapsed(false, true);

    // Board page temporarily collapses sidebar without persisting
    service.setSidebarCollapsed(true, false);
    expect(service.isSidebarCollapsed()).toBe(true);
    expect(localStorage.getItem('datn_sidebar_collapsed')).toBe('false');

    // Leaving board page restores preference
    service.restoreSidebarPreference();
    expect(service.isSidebarCollapsed()).toBe(false);
  });
});
