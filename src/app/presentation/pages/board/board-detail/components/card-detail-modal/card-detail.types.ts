export type PriorityType = 'Low' | 'Medium' | 'High' | 'Urgent';
export type WorkType = 'Task' | 'Bug' | 'Feature' | 'Epic';

export interface PriorityOption {
  value: PriorityType;
  label: string;
  icon: string;
  colorClass: string;
  bgPillClass: string;
}

export interface WorkTypeOption {
  value: WorkType;
  label: string;
  icon: string;
  colorClass: string;
  bgPillClass: string;
}

export interface CardDetailAttachment {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  isCover: boolean;
}

export interface CardDetailActivity {
  id: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  actionText: string;
  createdAt: string;
  isComment?: boolean;
  commentContent?: string;
}

export const DEFAULT_PRIORITY_OPTIONS: PriorityOption[] = [
  {
    value: 'Low',
    label: 'Low',
    icon: 'arrow_downward',
    colorClass: 'text-emerald-500 dark:text-emerald-400',
    bgPillClass:
      'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30',
  },
  {
    value: 'Medium',
    label: 'Medium',
    icon: 'drag_handle',
    colorClass: 'text-amber-500 dark:text-amber-400',
    bgPillClass:
      'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30',
  },
  {
    value: 'High',
    label: 'High',
    icon: 'arrow_upward',
    colorClass: 'text-orange-500 dark:text-orange-400',
    bgPillClass:
      'bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-500/30',
  },
  {
    value: 'Urgent',
    label: 'Urgent',
    icon: 'priority_high',
    colorClass: 'text-rose-500 dark:text-rose-400',
    bgPillClass:
      'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30',
  },
];

export const DEFAULT_WORK_TYPE_OPTIONS: WorkTypeOption[] = [
  {
    value: 'Task',
    label: 'Task',
    icon: 'task_alt',
    colorClass: 'text-sky-500 dark:text-sky-400',
    bgPillClass:
      'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-500/30',
  },
  {
    value: 'Bug',
    label: 'Bug',
    icon: 'pest_control',
    colorClass: 'text-rose-500 dark:text-rose-400',
    bgPillClass:
      'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30',
  },
  {
    value: 'Feature',
    label: 'Feature',
    icon: 'bookmark',
    colorClass: 'text-emerald-500 dark:text-emerald-400',
    bgPillClass:
      'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30',
  },
  {
    value: 'Epic',
    label: 'Epic',
    icon: 'bolt',
    colorClass: 'text-purple-500 dark:text-purple-400',
    bgPillClass:
      'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30',
  },
];
