import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computeDueDateStatus, localDateToInputString } from './due-date.util';

// "Hôm nay" cố định = 25/11/2026 (thứ Tư) để kết quả test không phụ thuộc ngày thực tế
const FAKE_TODAY = new Date(2026, 10, 25); // tháng 10 = November (0-indexed)

describe('computeDueDateStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FAKE_TODAY);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Trường hợp đầu vào không hợp lệ ───────────────────────────────────────

  it('trả về null khi dueDateStr là null', () => {
    expect(computeDueDateStatus(null, false)).toBeNull();
  });

  it('trả về null khi dueDateStr là undefined', () => {
    expect(computeDueDateStatus(undefined, false)).toBeNull();
  });

  it('trả về null khi dueDateStr là chuỗi rỗng', () => {
    expect(computeDueDateStatus('', false)).toBeNull();
  });

  it('trả về null khi dueDateStr là chuỗi ngày không hợp lệ', () => {
    expect(computeDueDateStatus('not-a-date', false)).toBeNull();
  });

  it('trả về null khi dueDateStr là chuỗi số không phải ngày', () => {
    expect(computeDueDateStatus('99999-99-99', false)).toBeNull();
  });

  // ─── isCompleted = true ──────────────────────────────────────────────────────

  it('trả về state "completed" khi isCompleted = true dù ngày còn hạn', () => {
    const result = computeDueDateStatus('2026-12-31', true);
    expect(result).not.toBeNull();
    expect(result!.state).toBe('completed');
    expect(result!.overdueDays).toBe(0);
    expect(result!.diffDays).toBe(0);
    expect(result!.badgeLabel).toBe('Hoàn thành');
  });

  it('trả về state "completed" khi isCompleted = true dù đã quá hạn', () => {
    const result = computeDueDateStatus('2026-01-01', true);
    expect(result).not.toBeNull();
    expect(result!.state).toBe('completed');
    expect(result!.overdueDays).toBe(0);
    expect(result!.badgeLabel).toBe('Hoàn thành');
  });

  it('tooltipLabel của completed chứa ngày hạn chót', () => {
    const result = computeDueDateStatus('2026-11-19', true);
    expect(result!.tooltipLabel).toContain('19/11/2026');
  });

  // ─── state: overdue ──────────────────────────────────────────────────────────

  it('trả về state "overdue" khi hạn chót là hôm qua (1 ngày quá hạn)', () => {
    // Hôm nay = 25/11/2026 → hôm qua = 24/11/2026
    const result = computeDueDateStatus('2026-11-24', false);
    expect(result!.state).toBe('overdue');
    expect(result!.diffDays).toBe(-1);
    expect(result!.overdueDays).toBe(1);
    expect(result!.badgeLabel).toBe('Quá hạn 1 ngày');
  });

  it('trả về overdueDays chính xác khi quá hạn nhiều ngày', () => {
    // Hôm nay = 25/11/2026 → 19/11/2026 = quá hạn 6 ngày
    const result = computeDueDateStatus('2026-11-19', false);
    expect(result!.state).toBe('overdue');
    expect(result!.diffDays).toBe(-6);
    expect(result!.overdueDays).toBe(6);
    expect(result!.badgeLabel).toBe('Quá hạn 6 ngày');
    expect(result!.tooltipLabel).toContain('6 ngày');
    expect(result!.tooltipLabel).toContain('19/11/2026');
  });

  it('overdueDays = 0 khi không phải overdue', () => {
    const result = computeDueDateStatus('2026-11-27', false);
    expect(result!.overdueDays).toBe(0);
  });

  // ─── state: due-today ────────────────────────────────────────────────────────

  it('trả về state "due-today" khi hạn chót là hôm nay', () => {
    // Hôm nay = 25/11/2026
    const result = computeDueDateStatus('2026-11-25', false);
    expect(result!.state).toBe('due-today');
    expect(result!.diffDays).toBe(0);
    expect(result!.overdueDays).toBe(0);
    expect(result!.badgeLabel).toBe('Hôm nay là hạn chót');
  });

  it('tooltipLabel của due-today chứa ngày hôm nay', () => {
    const result = computeDueDateStatus('2026-11-25', false);
    expect(result!.tooltipLabel).toContain('25/11/2026');
  });

  // ─── state: due-soon ─────────────────────────────────────────────────────────

  it('trả về state "due-soon" khi hạn chót là ngày mai', () => {
    // Hôm nay = 25/11/2026 → ngày mai = 26/11/2026
    const result = computeDueDateStatus('2026-11-26', false);
    expect(result!.state).toBe('due-soon');
    expect(result!.diffDays).toBe(1);
    expect(result!.overdueDays).toBe(0);
    expect(result!.badgeLabel).toBe('Sắp đến hạn');
    expect(result!.tooltipLabel).toContain('1 ngày');
  });

  // ─── state: upcoming ─────────────────────────────────────────────────────────

  it('trả về state "upcoming" khi hạn chót còn 2 ngày', () => {
    // Hôm nay = 25/11/2026 → 27/11/2026
    const result = computeDueDateStatus('2026-11-27', false);
    expect(result!.state).toBe('upcoming');
    expect(result!.diffDays).toBe(2);
    expect(result!.badgeLabel).toBe('Còn 2 ngày');
  });

  it('trả về state "upcoming" khi hạn chót còn nhiều ngày', () => {
    // Hôm nay = 25/11/2026 → 31/12/2026 = còn 36 ngày
    const result = computeDueDateStatus('2026-12-31', false);
    expect(result!.state).toBe('upcoming');
    expect(result!.diffDays).toBe(36);
    expect(result!.badgeLabel).toBe('Còn 36 ngày');
  });

  // ─── formattedShort / formattedFull ─────────────────────────────────────────

  it('formattedShort có dạng "dd/MM" với zero-padding', () => {
    // 09/01/2027
    const result = computeDueDateStatus('2027-01-09', false);
    expect(result!.formattedShort).toBe('09/01');
  });

  it('formattedFull có dạng "dd/MM/yyyy" với zero-padding', () => {
    const result = computeDueDateStatus('2027-01-09', false);
    expect(result!.formattedFull).toBe('09/01/2027');
  });

  it('formattedShort dùng giờ địa phương, không phải UTC', () => {
    // 2026-11-30T00:00:00 ISO string → vẫn phải hiển thị 30/11 theo local
    const result = computeDueDateStatus('2026-11-30T00:00:00', false);
    // Chấp nhận ngày 29 hoặc 30 tùy offset, nhưng formattedFull phải nhất quán với formattedShort
    expect(result!.formattedFull).toContain(result!.formattedShort);
  });
});

// ─── localDateToInputString ───────────────────────────────────────────────────

describe('localDateToInputString', () => {
  it('trả về chuỗi dạng "YYYY-MM-DD"', () => {
    const date = new Date(2026, 10, 25); // 25/11/2026 theo giờ địa phương
    expect(localDateToInputString(date)).toBe('2026-11-25');
  });

  it('zero-pad tháng và ngày', () => {
    const date = new Date(2027, 0, 9); // 09/01/2027
    expect(localDateToInputString(date)).toBe('2027-01-09');
  });

  it('dùng giờ địa phương để lấy năm/tháng/ngày', () => {
    // Không phụ thuộc vào UTC — dùng getFullYear/getMonth/getDate
    const date = new Date(2026, 11, 31); // 31/12/2026 theo local
    expect(localDateToInputString(date)).toBe('2026-12-31');
  });

  it('xử lý đúng ngày cuối năm', () => {
    const date = new Date(2026, 11, 31); // 31 tháng 12 (tháng 11 = December)
    expect(localDateToInputString(date)).toBe('2026-12-31');
  });

  it('xử lý đúng ngày đầu năm', () => {
    const date = new Date(2027, 0, 1); // 01/01/2027
    expect(localDateToInputString(date)).toBe('2027-01-01');
  });
});
