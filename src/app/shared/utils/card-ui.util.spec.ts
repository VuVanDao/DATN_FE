import { describe, expect, it } from 'vitest';
import {
  getPriorityClass,
  getTypeColorClass,
  getTypeIcon,
  getTypeLabel,
  normalizePriority,
  normalizeWorkType,
} from './card-ui.util';

describe('card-ui.util', () => {
  describe('getTypeIcon', () => {
    it('trả về pest_control cho loại Bug (chuỗi hoặc số 1)', () => {
      expect(getTypeIcon('Bug')).toBe('pest_control');
      expect(getTypeIcon('bug')).toBe('pest_control');
      expect(getTypeIcon(1)).toBe('pest_control');
      expect(getTypeIcon('1')).toBe('pest_control');
    });

    it('trả về bookmark cho loại Story/Feature (chuỗi hoặc số 2)', () => {
      expect(getTypeIcon('Story')).toBe('bookmark');
      expect(getTypeIcon('Feature')).toBe('bookmark');
      expect(getTypeIcon('features')).toBe('bookmark');
      expect(getTypeIcon(2)).toBe('bookmark');
    });

    it('trả về bolt cho loại Epic (chuỗi hoặc số 3)', () => {
      expect(getTypeIcon('Epic')).toBe('bolt');
      expect(getTypeIcon('epic')).toBe('bolt');
      expect(getTypeIcon(3)).toBe('bolt');
    });

    it('trả về task_alt cho Task hoặc giá trị mặc định / rỗng', () => {
      expect(getTypeIcon('Task')).toBe('task_alt');
      expect(getTypeIcon(0)).toBe('task_alt');
      expect(getTypeIcon(null)).toBe('task_alt');
      expect(getTypeIcon(undefined)).toBe('task_alt');
      expect(getTypeIcon('unknown')).toBe('task_alt');
    });
  });

  describe('getTypeColorClass', () => {
    it('trả về màu rose cho loại Bug', () => {
      expect(getTypeColorClass('Bug')).toContain('text-rose-500');
    });

    it('trả về màu emerald cho loại Feature/Story', () => {
      expect(getTypeColorClass('Feature')).toContain('text-emerald-500');
      expect(getTypeColorClass('Story')).toContain('text-emerald-500');
    });

    it('trả về màu purple cho loại Epic', () => {
      expect(getTypeColorClass('Epic')).toContain('text-purple-500');
    });

    it('trả về màu sky cho Task hoặc mặc định', () => {
      expect(getTypeColorClass('Task')).toContain('text-sky-500');
      expect(getTypeColorClass(null)).toContain('text-sky-500');
    });
  });

  describe('getTypeLabel', () => {
    it('trả về Bug cho Bug hoặc 1', () => {
      expect(getTypeLabel('Bug')).toBe('Bug');
      expect(getTypeLabel(1)).toBe('Bug');
    });

    it('trả về Feature cho Feature/Story hoặc 2', () => {
      expect(getTypeLabel('Feature')).toBe('Feature');
      expect(getTypeLabel('story')).toBe('Feature');
      expect(getTypeLabel(2)).toBe('Feature');
    });

    it('trả về Epic cho Epic hoặc 3', () => {
      expect(getTypeLabel('Epic')).toBe('Epic');
      expect(getTypeLabel(3)).toBe('Epic');
    });

    it('trả về Task cho Task hoặc mặc định', () => {
      expect(getTypeLabel('Task')).toBe('Task');
      expect(getTypeLabel(null)).toBe('Task');
      expect(getTypeLabel(undefined)).toBe('Task');
    });
  });

  describe('getPriorityClass', () => {
    it('trả về style rose cho Urgent', () => {
      expect(getPriorityClass('Urgent')).toContain('text-rose-700');
      expect(getPriorityClass(3)).toContain('text-rose-700');
    });

    it('trả về style orange cho High', () => {
      expect(getPriorityClass('High')).toContain('text-orange-700');
      expect(getPriorityClass(2)).toContain('text-orange-700');
    });

    it('trả về style amber cho Medium', () => {
      expect(getPriorityClass('Medium')).toContain('text-amber-700');
      expect(getPriorityClass(1)).toContain('text-amber-700');
    });

    it('trả về style emerald cho Low hoặc mặc định', () => {
      expect(getPriorityClass('Low')).toContain('text-emerald-700');
      expect(getPriorityClass(null)).toContain('text-emerald-700');
      expect(getPriorityClass(undefined)).toContain('text-emerald-700');
    });
  });

  describe('normalizePriority', () => {
    it('chuẩn hoá đúng các dạng số và chuỗi', () => {
      expect(normalizePriority(0)).toBe('Low');
      expect(normalizePriority(1)).toBe('Medium');
      expect(normalizePriority(2)).toBe('High');
      expect(normalizePriority(3)).toBe('Urgent');
      expect(normalizePriority('urgent')).toBe('Urgent');
      expect(normalizePriority('high')).toBe('High');
      expect(normalizePriority('medium')).toBe('Medium');
      expect(normalizePriority('low')).toBe('Low');
      expect(normalizePriority(null)).toBe('Low');
    });
  });

  describe('normalizeWorkType', () => {
    it('chuẩn hoá đúng các dạng số và chuỗi', () => {
      expect(normalizeWorkType(0)).toBe('Task');
      expect(normalizeWorkType(1)).toBe('Bug');
      expect(normalizeWorkType(2)).toBe('Feature');
      expect(normalizeWorkType(3)).toBe('Epic');
      expect(normalizeWorkType('bug')).toBe('Bug');
      expect(normalizeWorkType('feature')).toBe('Feature');
      expect(normalizeWorkType('features')).toBe('Feature');
      expect(normalizeWorkType('story')).toBe('Feature');
      expect(normalizeWorkType('epic')).toBe('Epic');
      expect(normalizeWorkType('task')).toBe('Task');
      expect(normalizeWorkType(null)).toBe('Task');
    });
  });
});
