/**
 * Tiện ích tính toán trạng thái hạn chót (due date) cho thẻ công việc.
 * Dùng chuẩn hóa về 00:00:00 giờ địa phương để so sánh theo ngày lịch,
 * tương tự cách tính ở SprintItemComponent và BoardHeaderComponent.
 *
 * @module due-date.util
 */

/** Các trạng thái có thể của hạn chót */
export type DueDateState = 'completed' | 'overdue' | 'due-today' | 'due-soon' | 'upcoming';

/** Kết quả trả về từ computeDueDateStatus */
export interface DueDateStatus {
  /** Trạng thái ngữ nghĩa của hạn chót */
  state: DueDateState;
  /** Số ngày còn lại (dương) hoặc đã quá hạn (âm), 0 = hôm nay */
  diffDays: number;
  /** Số ngày đã quá hạn (Math.abs(diffDays)) khi overdue, ngược lại = 0 */
  overdueDays: number;
  /** Ngày ngắn theo giờ địa phương, dạng "dd/MM" (ví dụ: "19/11") */
  formattedShort: string;
  /** Ngày đầy đủ theo giờ địa phương, dạng "dd/MM/yyyy" (ví dụ: "19/11/2026") */
  formattedFull: string;
  /** Nhãn hiển thị trên badge: "Quá hạn 6 ngày", "Hôm nay là hạn chót", v.v. */
  badgeLabel: string;
  /** Nội dung tooltip đầy đủ hơn */
  tooltipLabel: string;
}

/**
 * Tính trạng thái hạn chót của một thẻ công việc.
 *
 * @param endTimeString - ISO date string hoặc YYYY-MM-DD (null/undefined → trả về null)
 * @param isCompleted - Nếu true, trả về state 'completed' bất kể ngày
 * @returns DueDateStatus hoặc null nếu không có ngày hợp lệ
 */
export const computeDueDateStatus = (
  endTimeString: string | null | undefined,
  isCompleted: boolean,
): DueDateStatus | null => {
  if (!endTimeString) return null;

  const endTime = new Date(endTimeString);
  if (isNaN(endTime.getTime())) return null;

  const formattedShort = `${String(endTime.getDate()).padStart(2, '0')}/${String(endTime.getMonth() + 1).padStart(2, '0')}`;
  const formattedFull = `${formattedShort}/${endTime.getFullYear()}`;

  if (isCompleted) {
    return {
      state: 'completed',
      diffDays: 0,
      overdueDays: 0,
      formattedShort,
      formattedFull,
      badgeLabel: 'Hoàn thành',
      tooltipLabel: `Đã hoàn thành (Hạn chót: ${formattedFull})`,
    };
  }

  // Chuẩn hóa về 00:00:00 giờ địa phương để so sánh theo ngày lịch
  // (tương tự sprint-item.component.ts lines 59-66)
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dueMidnight = new Date(
    endTime.getFullYear(),
    endTime.getMonth(),
    endTime.getDate(),
  ).getTime();
  const diffDays = Math.round((dueMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
  const isOverdue = diffDays < 0;
  const overdueDays = isOverdue ? Math.abs(diffDays) : 0;

  let state: DueDateState;
  let badgeLabel: string;
  let tooltipLabel: string;

  if (isOverdue) {
    state = 'overdue';
    badgeLabel = `Quá hạn ${overdueDays} ngày`;
    tooltipLabel = `Đã quá hạn ${overdueDays} ngày (Hạn chót: ${formattedFull})`;
  } else if (diffDays === 0) {
    state = 'due-today';
    badgeLabel = 'Hôm nay là hạn chót';
    tooltipLabel = `Hôm nay là hạn chót (${formattedFull})`;
  } else if (diffDays === 1) {
    state = 'due-soon';
    badgeLabel = 'Sắp đến hạn';
    tooltipLabel = `Còn 1 ngày (Hạn chót: ${formattedFull})`;
  } else {
    state = 'upcoming';
    badgeLabel = `Còn ${diffDays} ngày`;
    tooltipLabel = `Hạn chót: ${formattedFull}`;
  }

  return { state, diffDays, overdueDays, formattedShort, formattedFull, badgeLabel, tooltipLabel };
};

/**
 * Chuyển Date → chuỗi "YYYY-MM-DD" theo giờ ĐỊA PHƯƠNG (không dùng UTC),
 * dùng để set giá trị cho <input type="date">.
 * Tránh lỗi lệch ngày do chênh lệch múi giờ UTC +07:00.
 *
 * @param date - Đối tượng Date cần chuyển đổi
 * @returns Chuỗi dạng "YYYY-MM-DD"
 */
export const localDateToInputString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Chuyển chuỗi ngày ISO hoặc chuỗi ngày bất kỳ → "YYYY-MM-DD" theo giờ ĐỊA PHƯƠNG,
 * dùng để gán trực tiếp vào thuộc tính [ngModel] của <input type="date">.
 * Trả về chuỗi rỗng nếu đầu vào là null, undefined hoặc ngày không hợp lệ.
 *
 * @param isoOrDateStr - Chuỗi ISO hoặc chuỗi biểu diễn ngày
 * @returns Chuỗi dạng "YYYY-MM-DD" hoặc ""
 */
export const formatIsoForDateInput = (isoOrDateStr?: string | null): string => {
  if (!isoOrDateStr) return '';
  const date = new Date(isoOrDateStr);
  if (isNaN(date.getTime())) return '';
  return localDateToInputString(date);
};
