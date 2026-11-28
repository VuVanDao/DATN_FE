import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ColumnSummary } from '../../../../../../../domain/models/board-detail.model';
import { BoardColumnMenuComponent } from './board-column-menu.component';

describe('BoardColumnMenuComponent', () => {
  let component: BoardColumnMenuComponent;
  let fixture: ComponentFixture<BoardColumnMenuComponent>;

  const mockColumn: ColumnSummary = {
    id: 'col-1',
    title: 'To Do',
    position: 0,
    isDoneColumn: false,
    boardId: 'b-1',
    cards: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardColumnMenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardColumnMenuComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('column', mockColumn);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle menu open state', () => {
    expect(component.isMenuOpen()).toBe(false);
    component.toggleMenu();
    expect(component.isMenuOpen()).toBe(true);
    component.closeMenu();
    expect(component.isMenuOpen()).toBe(false);
  });

  it('should emit addCard and close menu', () => {
    const addCardSpy = vi.fn();
    component.addCard.subscribe(addCardSpy);
    component.isMenuOpen.set(true);

    component.onAddCard();

    expect(component.isMenuOpen()).toBe(false);
    expect(addCardSpy).toHaveBeenCalled();
  });

  it('should emit toggleDone and close menu', () => {
    const toggleDoneSpy = vi.fn();
    component.toggleDone.subscribe(toggleDoneSpy);
    component.isMenuOpen.set(true);

    component.onToggleDone();

    expect(component.isMenuOpen()).toBe(false);
    expect(toggleDoneSpy).toHaveBeenCalled();
  });

  it('should emit deleteColumn and close menu', () => {
    const deleteSpy = vi.fn();
    component.deleteColumn.subscribe(deleteSpy);
    component.isMenuOpen.set(true);

    component.onDelete();

    expect(component.isMenuOpen()).toBe(false);
    expect(deleteSpy).toHaveBeenCalled();
  });
});
