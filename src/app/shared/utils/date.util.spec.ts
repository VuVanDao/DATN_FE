import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatDateForInput,
  formatDisplayDate,
  formatDisplayDateTime,
  formatRelativeTime,
} from './date.util';

describe('date.util', () => {
  const FAKE_NOW = new Date('2026-11-28T21:30:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FAKE_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatDateForInput', () => {
    it('chuyển Date thành chuỗi YYYY-MM-DD theo giờ địa phương', () => {
      const d = new Date(2026, 10, 5); // 5/11/2026
      expect(formatDateForInput(d)).toBe('2026-11-05');
    });

    it('chuyển chuỗi ISO thành chuỗi YYYY-MM-DD', () => {
      const d = new Date(2026, 0, 15); // 15/01/2026
      expect(formatDateForInput(d.toISOString())).toBe(formatDateForInput(d));
    });

    it('trả về chuỗi rỗng khi đầu vào là null, undefined hoặc chuỗi không hợp lệ', () => {
      expect(formatDateForInput(null)).toBe('');
      expect(formatDateForInput(undefined)).toBe('');
      expect(formatDateForInput('invalid-date')).toBe('');
    });
  });

  describe('formatDisplayDate', () => {
    it('định dạng ngày thành dd/MM/yyyy', () => {
      const d = new Date(2026, 10, 28);
      expect(formatDisplayDate(d)).toBe('28/11/2026');
    });

    it('trả về fallback khi ngày không hợp lệ', () => {
      expect(formatDisplayDate(null, 'Chưa thiết lập')).toBe('Chưa thiết lập');
      expect(formatDisplayDate(undefined)).toBe('');
      expect(formatDisplayDate('invalid')).toBe('');
    });
  });

  describe('formatDisplayDateTime', () => {
    it('định dạng ngày giờ kèm giờ phút', () => {
      const d = new Date(2026, 10, 28, 14, 30);
      const formatted = formatDisplayDateTime(d);
      expect(formatted).toContain('28');
      expect(formatted).toContain('2026');
      expect(formatted).toContain('14:30');
    });

    it('trả về fallback khi đầu vào null hoặc không hợp lệ', () => {
      expect(formatDisplayDateTime(null)).toBe('');
      expect(formatDisplayDateTime(undefined, 'N/A')).toBe('N/A');
    });
  });

  describe('formatRelativeTime', () => {
    it('trả về "Vừa xong" khi thời gian < 1 phút', () => {
      const past = new Date(FAKE_NOW.getTime() - 30 * 1000);
      expect(formatRelativeTime(past)).toBe('Vừa xong');
    });

    it('trả về "X phút trước" khi thời gian < 60 phút', () => {
      const past = new Date(FAKE_NOW.getTime() - 15 * 60 * 1000);
      expect(formatRelativeTime(past)).toBe('15 phút trước');
    });

    it('trả về "X giờ trước" khi thời gian < 24 giờ', () => {
      const past = new Date(FAKE_NOW.getTime() - 4 * 60 * 60 * 1000);
      expect(formatRelativeTime(past)).toBe('4 giờ trước');
    });

    it('trả về "Hôm qua" khi thời gian cách 1 ngày', () => {
      const past = new Date(FAKE_NOW.getTime() - 25 * 60 * 60 * 1000);
      expect(formatRelativeTime(past)).toBe('Hôm qua');
    });

    it('trả về "X ngày trước" khi thời gian từ 2 đến 6 ngày', () => {
      const past = new Date(FAKE_NOW.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(past)).toBe('3 ngày trước');
    });

    it('trả về định dạng dd/MM/yyyy khi thời gian >= 7 ngày', () => {
      const past = new Date(FAKE_NOW.getTime() - 10 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(past)).toBe(formatDisplayDate(past));
    });

    it('trả về fallback khi không hợp lệ', () => {
      expect(formatRelativeTime(null)).toBe('');
      expect(formatRelativeTime(undefined, 'Không xác định')).toBe('Không xác định');
    });
  });
});
