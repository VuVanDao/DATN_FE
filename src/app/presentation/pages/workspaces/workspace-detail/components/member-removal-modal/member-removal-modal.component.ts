import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { WorkspaceMember } from '../../../../../../domain/models/workspace.model';
import { WorkspaceStore } from '../../../../../state/workspace.store';

@Component({
  selector: 'app-member-removal-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './member-removal-modal.component.html',
})
export class MemberRemovalModalComponent implements OnChanges {
  readonly workspaceStore = inject(WorkspaceStore);

  @Input() isOpen = false;

  @Input() workspaceId = '';

  @Input() member: WorkspaceMember | null = null;

  // Cờ xác định người thực hiện có phải là tự rời khỏi workspace hay không
  @Input() isSelf = false;

  @Output() closed = new EventEmitter<void>();

  @Output() memberRemoved = new EventEmitter<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isOpen && this.workspaceId && this.member) {
      if (changes['isOpen']?.currentValue === true || changes['member']) {
        this.loadImpact();
      }
    }
  }

  loadImpact(): void {
    if (!this.member || !this.workspaceId) {
      return;
    }

    this.workspaceStore.getMemberRemovalImpact(this.workspaceId, this.member.userId);
  }

  close(): void {
    this.workspaceStore.clearMemberRemovalImpact();

    this.closed.emit();
  }

  confirmRemove(): void {
    if (!this.member || !this.workspaceId) {
      return;
    }

    if (this.workspaceStore.memberRemovalImpact()?.isProjectLeader) {
      return;
    }

    const targetUserId = this.member.userId;

    this.workspaceStore.removeMember(
      this.workspaceId,
      targetUserId,
      () => {
        this.memberRemoved.emit(targetUserId);

        this.close();
      },
      () => {},
    );
  }
}
