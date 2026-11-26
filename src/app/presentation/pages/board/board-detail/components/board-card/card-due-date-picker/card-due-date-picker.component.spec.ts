import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CardDueDatePickerComponent } from './card-due-date-picker.component';

describe('CardDueDatePickerComponent', () => {
  let component: CardDueDatePickerComponent;
  let fixture: ComponentFixture<CardDueDatePickerComponent>;
  const mockOrigin = {
    elementRef: new ElementRef(document.createElement('button')),
  } as unknown as CdkOverlayOrigin;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardDueDatePickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardDueDatePickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('origin', mockOrigin);
  });

  it('khởi tạo thành công', () => {
    expect(component).toBeTruthy();
    expect(component.isOpen()).toBe(false);
  });

  it('nhận và định dạng startDate và dueDate khi isOpen = true', () => {
    fixture.componentRef.setInput('startDate', '2026-11-20T00:00:00Z');
    fixture.componentRef.setInput('dueDate', '2026-11-25T00:00:00Z');
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    expect(component.startDateInput()).toContain('2026-11-2');
    expect(component.dueDateInput()).toContain('2026-11-2');
  });

  it('phát hiện dải ngày không hợp lệ khi startDate > dueDate', () => {
    component.startDateInput.set('2026-11-28');
    component.dueDateInput.set('2026-11-20');
    expect(component.isInvalidRange()).toBe(true);
  });

  it('cho phép startDate <= dueDate hoặc chỉ nhập dueDate', () => {
    component.startDateInput.set('2026-11-20');
    component.dueDateInput.set('2026-11-25');
    expect(component.isInvalidRange()).toBe(false);

    component.startDateInput.set('2026-11-25');
    component.dueDateInput.set('2026-11-25');
    expect(component.isInvalidRange()).toBe(false);

    component.startDateInput.set('');
    component.dueDateInput.set('2026-11-25');
    expect(component.isInvalidRange()).toBe(false);
  });

  it('phát sự kiện saveDates khi gọi onSave và dải ngày hợp lệ', () => {
    let saved: { startDate: string | null; dueDate: string | null } | null = null;
    component.saveDates.subscribe((data) => {
      saved = data;
    });

    component.startDateInput.set('2026-11-20');
    component.dueDateInput.set('2026-11-25');
    component.onSave();

    expect(saved).toEqual({
      startDate: '2026-11-20',
      dueDate: '2026-11-25',
    });
  });

  it('không phát sự kiện saveDates khi isInvalidRange = true', () => {
    let called = false;
    component.saveDates.subscribe(() => {
      called = true;
    });

    component.startDateInput.set('2026-11-30');
    component.dueDateInput.set('2026-11-20');
    component.onSave();

    expect(called).toBe(false);
  });

  it('phát sự kiện clearDates và xoá input khi gọi onClear', () => {
    let cleared = false;
    component.clearDates.subscribe(() => {
      cleared = true;
    });

    component.startDateInput.set('2026-11-20');
    component.dueDateInput.set('2026-11-25');
    component.onClear();

    expect(cleared).toBe(true);
    expect(component.startDateInput()).toBe('');
    expect(component.dueDateInput()).toBe('');
  });

  it('placement mặc định là "start" và overlayPositions thay đổi khi placement = "end"', () => {
    expect(component.placement()).toBe('start');
    const startPositions = component.overlayPositions();
    expect(startPositions[0].originX).toBe('start');

    fixture.componentRef.setInput('placement', 'end');
    fixture.detectChanges();
    const endPositions = component.overlayPositions();
    expect(endPositions[0].originX).toBe('end');
  });
});
