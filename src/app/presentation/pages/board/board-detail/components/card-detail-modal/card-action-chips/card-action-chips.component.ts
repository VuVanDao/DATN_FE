import { CommonModule } from '@angular/common';
import { Component, effect, HostListener, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProjectMember } from '../../../../../../../domain/models/project.model';
import {
  DEFAULT_PRIORITY_OPTIONS,
  DEFAULT_WORK_TYPE_OPTIONS,
  PriorityOption,
  PriorityType,
  WorkType,
  WorkTypeOption,
} from '../card-detail.types';

@Component({
  selector: 'app-card-action-chips',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './card-action-chips.component.html',
  host: {
    class: 'block',
  },
})
export class CardActionChipsComponent {
  readonly priority = input<PriorityType>('Low');
  readonly type = input<WorkType>('Task');
  readonly startDate = input<string>('');
  readonly dueDate = input<string>('');
  readonly assigneeId = input<string | null>(null);
  readonly assigneeName = input<string | null>(null);
  readonly reporterName = input<string>('Thành viên');
  readonly members = input<ProjectMember[]>([]);
  readonly storyPoints = input<number | null | undefined>(null);

  readonly priorityChanged = output<PriorityType>();
  readonly typeChanged = output<WorkType>();
  readonly datesChanged = output<{ startDate: string | null; dueDate: string | null }>();
  readonly assigneeChanged = output<{ assigneeId: string | null; assigneeName: string | null }>();
  readonly storyPointsChanged = output<number | null>();

  // Dropdown states
  readonly isPriorityMenuOpen = signal<boolean>(false);
  readonly isTypeMenuOpen = signal<boolean>(false);
  readonly isDatesMenuOpen = signal<boolean>(false);
  readonly isMembersMenuOpen = signal<boolean>(false);
  readonly isStoryPointsMenuOpen = signal<boolean>(false);

  // Local dates state for popover editing
  readonly localStartDate = signal<string>('');
  readonly localDueDate = signal<string>('');

  // Story Points options & custom input
  readonly commonPointOptions: number[] = [1, 2, 3, 5, 8, 13, 21];
  readonly customPoints = signal<string>('');

  readonly priorityOptions: PriorityOption[] = DEFAULT_PRIORITY_OPTIONS;
  readonly typeOptions: WorkTypeOption[] = DEFAULT_WORK_TYPE_OPTIONS;

  constructor() {
    effect(() => {
      this.localStartDate.set(this.startDate() || '');
      this.localDueDate.set(this.dueDate() || '');
    });
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isPriorityMenuOpen.set(false);
    this.isTypeMenuOpen.set(false);
    this.isDatesMenuOpen.set(false);
    this.isMembersMenuOpen.set(false);
    this.isStoryPointsMenuOpen.set(false);
  }

  getCurrentPriorityOption(): PriorityOption {
    return (
      this.priorityOptions.find((p) => p.value === this.priority()) || this.priorityOptions[0]
    );
  }

  getCurrentTypeOption(): WorkTypeOption {
    return this.typeOptions.find((t) => t.value === this.type()) || this.typeOptions[0];
  }

  togglePriorityMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isPriorityMenuOpen.update((v) => !v);
    this.isTypeMenuOpen.set(false);
    this.isDatesMenuOpen.set(false);
    this.isMembersMenuOpen.set(false);
    this.isStoryPointsMenuOpen.set(false);
  }

  selectPriority(p: PriorityOption): void {
    this.isPriorityMenuOpen.set(false);
    this.priorityChanged.emit(p.value);
  }

  toggleTypeMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isTypeMenuOpen.update((v) => !v);
    this.isPriorityMenuOpen.set(false);
    this.isDatesMenuOpen.set(false);
    this.isMembersMenuOpen.set(false);
    this.isStoryPointsMenuOpen.set(false);
  }

  selectType(t: WorkTypeOption): void {
    this.isTypeMenuOpen.set(false);
    this.typeChanged.emit(t.value);
  }

  toggleDatesMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isDatesMenuOpen.update((v) => !v);
    this.isPriorityMenuOpen.set(false);
    this.isTypeMenuOpen.set(false);
    this.isMembersMenuOpen.set(false);
    this.isStoryPointsMenuOpen.set(false);
    if (this.isDatesMenuOpen()) {
      this.localStartDate.set(this.startDate() || '');
      this.localDueDate.set(this.dueDate() || '');
    }
  }

  saveDates(): void {
    const s = this.localStartDate() || null;
    const d = this.localDueDate() || null;
    this.isDatesMenuOpen.set(false);
    this.datesChanged.emit({ startDate: s, dueDate: d });
  }

  clearDates(): void {
    this.localStartDate.set('');
    this.localDueDate.set('');
    this.isDatesMenuOpen.set(false);
    this.datesChanged.emit({ startDate: null, dueDate: null });
  }

  toggleMembersMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isMembersMenuOpen.update((v) => !v);
    this.isPriorityMenuOpen.set(false);
    this.isTypeMenuOpen.set(false);
    this.isDatesMenuOpen.set(false);
    this.isStoryPointsMenuOpen.set(false);
  }

  assignMember(member: ProjectMember): void {
    this.isMembersMenuOpen.set(false);
    this.assigneeChanged.emit({
      assigneeId: member.userId,
      assigneeName: member.username,
    });
  }

  unassignMember(): void {
    this.isMembersMenuOpen.set(false);
    this.assigneeChanged.emit({
      assigneeId: null,
      assigneeName: null,
    });
  }

  toggleStoryPointsMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isStoryPointsMenuOpen.update((v) => !v);
    this.isPriorityMenuOpen.set(false);
    this.isTypeMenuOpen.set(false);
    this.isDatesMenuOpen.set(false);
    this.isMembersMenuOpen.set(false);
    if (this.isStoryPointsMenuOpen()) {
      this.customPoints.set(
        this.storyPoints() !== null && this.storyPoints() !== undefined
          ? String(this.storyPoints())
          : '',
      );
    }
  }

  selectStoryPoints(pts: number | null): void {
    this.isStoryPointsMenuOpen.set(false);
    this.storyPointsChanged.emit(pts);
  }

  saveCustomPoints(): void {
    const raw = this.customPoints().trim();
    if (!raw) {
      this.selectStoryPoints(null);
      return;
    }
    const val = parseInt(raw, 10);
    if (!isNaN(val) && val >= 0) {
      this.selectStoryPoints(val);
    } else {
      this.isStoryPointsMenuOpen.set(false);
    }
  }
}
