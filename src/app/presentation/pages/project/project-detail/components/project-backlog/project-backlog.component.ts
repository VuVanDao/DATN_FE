import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SprintStore } from '../../../../../../application/state/sprint.store';
import { CardSummary } from '../../../../../../domain/models/board-detail.model';

@Component({
  selector: 'app-project-backlog',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './project-backlog.component.html',
})
export class ProjectBacklogComponent implements OnInit, OnChanges {
  readonly sprintStore = inject(SprintStore);

  @Input({ required: true }) projectId = '';
  @Input() canManage = false;

  @Output() createSprintClick = new EventEmitter<void>();
  @Output() cardClick = new EventEmitter<CardSummary>();

  ngOnInit(): void {
    if (this.projectId) {
      this.sprintStore.loadBacklog(this.projectId);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && !changes['projectId'].firstChange && this.projectId) {
      this.sprintStore.loadBacklog(this.projectId);
    }
  }

  refreshBacklog(): void {
    if (this.projectId) {
      this.sprintStore.loadBacklog(this.projectId);
    }
  }

  getPriorityClass(priority: number | string): string {
    const p = String(priority).toLowerCase();
    switch (p) {
      case 'urgent':
      case '3':
        return 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60';
      case 'high':
      case '2':
        return 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60';
      case 'medium':
      case '1':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60';
      default:
        return 'text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  }

  getTypeIcon(type: number | string): string {
    const t = String(type).toLowerCase();
    switch (t) {
      case 'bug':
      case '1':
        return 'pest_control';
      case 'feature':
      case 'features':

      case '2':
        return 'bookmark';
      case 'epic':
      case '3':
        return 'bolt';
      default:
        return 'task_alt';
    }
  }

  getTypeColorClass(type: number | string): string {
    const t = String(type).toLowerCase();
    switch (t) {
      case 'bug':
      case '1':
        return 'text-rose-500 dark:text-rose-400';
      case 'feature':
      case 'features':
      case '2':
        return 'text-emerald-500 dark:text-emerald-400';
      case 'epic':
      case '3':
        return 'text-purple-500 dark:text-purple-400';
      default:
        return 'text-sky-500 dark:text-sky-400';
    }
  }

  getTypeLabel(type: number | string): string {
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

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
