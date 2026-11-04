import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProjectStore } from '../../../../../../application/state/project.store';
import { ProjectMemberPickerStore } from '../../../../../../application/project/project-member-picker.store';

interface SelectedMember {
  userId: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
}

@Component({
  selector: 'app-add-project-member-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  providers: [ProjectMemberPickerStore],
  templateUrl: './add-project-member-modal.component.html',
})
export class AddProjectMemberModalComponent implements OnChanges {
  readonly projectStore = inject(ProjectStore);
  readonly candidates = inject(ProjectMemberPickerStore).members;
  readonly submitError = signal<string | null>(null);
  readonly selectedMembers = signal<SelectedMember[]>([]);
  readonly touched = signal(false);

  @Input() isOpen = false;
  @Input() projectId = '';
  @Input() workspaceId = '';
  @Output() closed = new EventEmitter<void>();
  @Output() memberAdded = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] || changes['workspaceId'] || changes['projectId']) {
      this.candidates.clear();
      this.selectedMembers.set([]);
      this.touched.set(false);
      this.submitError.set(null);
      if (this.isOpen && this.workspaceId && this.projectId) {
        this.loadCandidates();
      }
    }
  }

  loadCandidates(more = false): void {
    if (this.workspaceId) this.candidates.load(this.workspaceId, more);
  }

  isProjectMember(userId: string): boolean {
    return this.projectStore.members().some((member) => member.userId === userId);
  }

  isSelected(userId: string): boolean {
    return this.selectedMembers().some((m) => m.userId === userId);
  }

  toggleMember(member: {
    userId: string;
    username: string;
    email: string;
    avatarUrl?: string | null;
  }): void {
    if (this.projectStore.isAddingMember() || this.isProjectMember(member.userId)) return;
    this.touched.set(true);
    this.submitError.set(null);

    if (this.isSelected(member.userId)) {
      this.selectedMembers.update((list) => list.filter((m) => m.userId !== member.userId));
    } else {
      this.selectedMembers.update((list) => [
        ...list,
        {
          userId: member.userId,
          username: member.username,
          email: member.email,
          avatarUrl: member.avatarUrl,
        },
      ]);
    }
  }

  removeMember(userId: string): void {
    if (this.projectStore.isAddingMember()) return;
    this.selectedMembers.update((list) => list.filter((m) => m.userId !== userId));
    this.submitError.set(null);
  }

  onSubmit(): void {
    if (this.projectStore.isAddingMember()) return;
    this.submitError.set(null);
    this.touched.set(true);

    const selected = this.selectedMembers();
    if (selected.length === 0 || !this.projectId || !this.workspaceId) {
      return;
    }

    // Validate: tất cả member đã chọn phải có trong workspace
    if (selected.some((m) => !this.candidates.items().some((c) => c.userId === m.userId))) {
      this.submitError.set('Vui lòng chọn các thành viên trong workspace.');
      return;
    }

    // Validate: không có member nào đã tham gia dự án
    if (selected.some((m) => this.isProjectMember(m.userId))) {
      this.submitError.set('Danh sách đã chọn có thành viên đã tham gia dự án.');
      return;
    }

    this.projectStore.addMembers(
      this.projectId,
      {
        members: selected.map((m) => ({ userId: m.userId, roleId: null })),
      },
      () => {
        this.memberAdded.emit();
        this.selectedMembers.set([]);
        this.touched.set(false);
        this.closed.emit();
      },
      (message) => this.submitError.set(message),
    );
  }

  close(): void {
    if (this.projectStore.isAddingMember()) return;
    this.candidates.clear();
    this.submitError.set(null);
    this.selectedMembers.set([]);
    this.touched.set(false);
    this.closed.emit();
  }
}
