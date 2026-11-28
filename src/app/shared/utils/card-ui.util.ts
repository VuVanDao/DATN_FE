/**
 * Tiện ích định dạng hiển thị UI (icon Material Design, class màu sắc Tailwind CSS, nhãn hiển thị, chuẩn hoá dữ liệu)
 * dùng chung cho các thẻ công việc (Card) trên toàn bộ hệ thống (Kanban, Backlog, Dependencies, Modal...).
 *
 * @module card-ui.util
 */

export type PriorityType = 'Low' | 'Medium' | 'High' | 'Urgent';
export type WorkType = 'Task' | 'Bug' | 'Feature' | 'Epic';

/**
 * Trả về tên Material Icon tương ứng với loại công việc (Task, Bug, Feature, Epic).
 * Hỗ trợ cả định dạng enum dạng số (0, 1, 2, 3) lẫn chuỗi text.
 *
 * @param type - Loại công việc (Task / Bug / Story / Feature / Epic hoặc 0 / 1 / 2 / 3)
 * @returns Tên icon Material tương ứng (task_alt, pest_control, bookmark, bolt)
 */
export function getTypeIcon(type: number | string | null | undefined): string {
  if (type === null || type === undefined) return 'task_alt';
  const t = String(type).toLowerCase();
  switch (t) {
    case '1':
    case 'bug':
      return 'pest_control';
    case '2':
    case 'story':
    case 'feature':
    case 'features':
      return 'bookmark';
    case '3':
    case 'epic':
      return 'bolt';
    default:
      return 'task_alt';
  }
}

/**
 * Trả về class màu sắc Tailwind CSS (hỗ trợ cả light mode và dark mode)
 * tương ứng với loại công việc.
 *
 * @param type - Loại công việc (Task / Bug / Story / Feature / Epic hoặc 0 / 1 / 2 / 3)
 * @returns Chuỗi class Tailwind CSS (ví dụ: 'text-rose-500 dark:text-rose-400')
 */
export function getTypeColorClass(type: number | string | null | undefined): string {
  if (type === null || type === undefined) return 'text-sky-500 dark:text-sky-400';
  const t = String(type).toLowerCase();
  switch (t) {
    case '1':
    case 'bug':
      return 'text-rose-500 dark:text-rose-400';
    case '2':
    case 'story':
    case 'feature':
    case 'features':
      return 'text-emerald-500 dark:text-emerald-400';
    case '3':
    case 'epic':
      return 'text-purple-500 dark:text-purple-400';
    default:
      return 'text-sky-500 dark:text-sky-400';
  }
}

/**
 * Trả về nhãn tên hiển thị chuẩn hoá (Task, Bug, Feature, Epic) cho loại công việc.
 *
 * @param type - Loại công việc
 * @returns Nhãn tên chuẩn hoá ('Task', 'Bug', 'Feature', 'Epic')
 */
export function getTypeLabel(type: number | string | null | undefined): string {
  if (type === null || type === undefined) return 'Task';
  const t = String(type).toLowerCase();
  switch (t) {
    case 'bug':
    case '1':
      return 'Bug';
    case 'feature':
    case 'features':
    case 'story':
    case '2':
      return 'Feature';
    case 'epic':
    case '3':
      return 'Epic';
    default:
      return 'Task';
  }
}

/**
 * Trả về class style badge/chip Tailwind CSS (màu nền, màu chữ, viền border, dark mode)
 * tương ứng với độ ưu tiên của thẻ (Urgent, High, Medium, Low).
 *
 * @param priority - Độ ưu tiên (Urgent / High / Medium / Low hoặc 3 / 2 / 1 / 0)
 * @returns Chuỗi class Tailwind CSS cho badge
 */
export function getPriorityClass(priority: number | string | null | undefined): string {
  if (priority === null || priority === undefined) {
    return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
  }
  const p = String(priority).toLowerCase();
  switch (p) {
    case '3':
    case 'urgent':
      return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900';
    case '2':
    case 'high':
      return 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900';
    case '1':
    case 'medium':
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900';
    default:
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
  }
}

/**
 * Chuẩn hoá độ ưu tiên từ backend (số hoặc chuỗi bất kỳ) thành PriorityType ('Low' | 'Medium' | 'High' | 'Urgent').
 *
 * @param val - Giá trị độ ưu tiên từ API (số hoặc chuỗi)
 * @returns PriorityType chuẩn hoá
 */
export function normalizePriority(val: number | string | null | undefined): PriorityType {
  if (typeof val === 'number') {
    const map: PriorityType[] = ['Low', 'Medium', 'High', 'Urgent'];
    return map[val] ?? 'Low';
  }
  if (typeof val === 'string') {
    const lower = val.toLowerCase();
    if (lower === 'urgent' || lower === '3') return 'Urgent';
    if (lower === 'high' || lower === '2') return 'High';
    if (lower === 'medium' || lower === '1') return 'Medium';
    return 'Low';
  }
  return 'Low';
}

/**
 * Chuẩn hoá loại công việc từ backend (số hoặc chuỗi bất kỳ) thành WorkType ('Task' | 'Bug' | 'Feature' | 'Epic').
 *
 * @param val - Giá trị loại công việc từ API (số hoặc chuỗi)
 * @returns WorkType chuẩn hoá
 */
export function normalizeWorkType(val: number | string | null | undefined): WorkType {
  if (typeof val === 'number') {
    const map: WorkType[] = ['Task', 'Bug', 'Feature', 'Epic'];
    return map[val] ?? 'Task';
  }
  if (typeof val === 'string') {
    const lower = val.toLowerCase();
    if (lower === 'bug' || lower === '1') return 'Bug';
    if (lower === 'feature' || lower === 'features' || lower === 'story' || lower === '2') return 'Feature';
    if (lower === 'epic' || lower === '3') return 'Epic';
    return 'Task';
  }
  return 'Task';
}
