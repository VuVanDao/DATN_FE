/**
 * Tiện ích định dạng ngày tháng và thời gian dùng chung trên toàn bộ ứng dụng.
 * Đảm bảo tính nhất quán theo giờ địa phương (local time) và locale vi-VN.
 *
 * @module date.util
 */

/**
 * Chuyển đổi Date hoặc chuỗi ngày thành "YYYY-MM-DD" theo giờ ĐỊA PHƯƠNG.
 * Thích hợp để gán trực tiếp vào thuộc tính [ngModel] / [value] của <input type="date">.
 * Tránh lỗi lệch ngày của toISOString() do chênh lệch múi giờ UTC+7.
 *
 * @param dateOrStr - Date instance hoặc chuỗi ngày/ISO
 * @returns Chuỗi dạng "YYYY-MM-DD" hoặc "" nếu không hợp lệ
 */
export function formatDateForInput(dateOrStr: Date | string | null | undefined): string {
  if (!dateOrStr) return '';
  const date = dateOrStr instanceof Date ? dateOrStr : new Date(dateOrStr);
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Định dạng ngày sang dạng hiển thị ngắn chuẩn Việt Nam: "dd/MM/yyyy" (ví dụ: "28/11/2026").
 *
 * @param dateOrStr - Date instance hoặc chuỗi ngày/ISO
 * @param fallback - Giá trị hiển thị thay thế nếu ngày không hợp lệ (mặc định là "")
 * @returns Chuỗi ngày định dạng "dd/MM/yyyy" hoặc fallback
 */
export function formatDisplayDate(
  dateOrStr: Date | string | null | undefined,
  fallback = '',
): string {
  if (!dateOrStr) return fallback;
  const date = dateOrStr instanceof Date ? dateOrStr : new Date(dateOrStr);
  if (isNaN(date.getTime())) return fallback;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Định dạng ngày giờ chi tiết (dùng cho Activity Log, Comment, Lịch sử...):
 * Ví dụ: "28 thg 11, 2026, 21:30"
 *
 * @param dateOrStr - Date instance hoặc chuỗi ngày/ISO
 * @param fallback - Giá trị trả về nếu không hợp lệ (mặc định là "")
 * @returns Chuỗi ngày giờ chi tiết
 */
export function formatDisplayDateTime(
  dateOrStr: Date | string | null | undefined,
  fallback = '',
): string {
  if (!dateOrStr) return fallback;
  const date = dateOrStr instanceof Date ? dateOrStr : new Date(dateOrStr);
  if (isNaN(date.getTime())) return fallback;

  return date.toLocaleString('vi-VN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Định dạng thời gian tương đối so với hiện tại:
 * - < 1 phút: "Vừa xong"
 * - < 60 phút: "X phút trước"
 * - < 24 giờ: "X giờ trước"
 * - 1 ngày: "Hôm qua"
 * - 2-6 ngày: "X ngày trước"
 * - >= 7 ngày: Hiển thị ngày định dạng "dd/MM/yyyy"
 *
 * @param dateOrStr - Date instance hoặc chuỗi ngày/ISO
 * @param fallback - Giá trị trả về nếu không hợp lệ (mặc định là "")
 * @returns Chuỗi thời gian tương đối
 */
export function formatRelativeTime(
  dateOrStr: Date | string | null | undefined,
  fallback = '',
): string {
  if (!dateOrStr) return fallback;
  const date = dateOrStr instanceof Date ? dateOrStr : new Date(dateOrStr);
  if (isNaN(date.getTime())) return fallback;

  const now = Date.now();
  const diffMs = now - date.getTime();
  if (diffMs < 0) {
    return 'Vừa xong';
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return formatDisplayDate(date);
}
