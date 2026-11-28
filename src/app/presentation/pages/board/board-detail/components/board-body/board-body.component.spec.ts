import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { BoardBodyComponent } from './board-body.component';

describe('BoardBodyComponent', () => {
  let component: BoardBodyComponent;
  let fixture: ComponentFixture<BoardBodyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardBodyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardBodyComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('columns', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open and cancel add list', () => {
    expect(component.isAddingList()).toBe(false);
    component.openAddList();
    expect(component.isAddingList()).toBe(true);
    component.cancelAddList();
    expect(component.isAddingList()).toBe(false);
  });
});
