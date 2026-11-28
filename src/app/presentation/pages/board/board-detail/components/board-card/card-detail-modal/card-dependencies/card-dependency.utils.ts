import { CardCandidate, CardDependencyItem } from '../../../../../../../../domain/models/board-detail.model';

export type { CardCandidate, CardDependencyItem };

export function getTypeIcon(type: number | string): string {
  const t = String(type).toLowerCase();
  switch (t) {
    case '1':
    case 'bug':
      return 'pest_control';
    case '2':
    case 'story':
    case 'feature':
      return 'bookmark';
    case '3':
    case 'epic':
      return 'bolt';
    default:
      return 'task_alt';
  }
}

export function getTypeColorClass(type: number | string): string {
  const t = String(type).toLowerCase();
  switch (t) {
    case '1':
    case 'bug':
      return 'text-rose-500';
    case '2':
    case 'story':
    case 'feature':
      return 'text-emerald-500';
    case '3':
    case 'epic':
      return 'text-purple-500';
    default:
      return 'text-sky-500';
  }
}

export function getPriorityClass(priority: number | string): string {
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
