import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { WorkspaceStore } from '../../../../../../application/state/workspace.store';
import { WorkspaceMember } from '../../../../../../domain/models/workspace.model';

@Component({
  selector: 'app-member-removal-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './member-removal-modal.component.html',
})
export class MemberRemovalModalComponent implements OnChanges, OnDestroy {
  readonly workspaceStore = inject(WorkspaceStore);

  @Input() isOpen = false;

  @Input() workspaceId = '';

  @Input() member: WorkspaceMember | null = null;

  // Cờ xác định người thực hiện có phải là tự rời khỏi workspace hay không
  @Input() isSelf = false;

  @Output() closed = new EventEmitter<void>();

  @Output() memberRemoved = new EventEmitter<{ memberId: string; workspaceId: string }>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === false) this.workspaceStore.clearMemberRemovalImpact();
    if (this.isOpen && this.workspaceId && this.member) {
      if (changes['isOpen']?.currentValue === true || changes['member'] || changes['workspaceId']) {
        this.loadImpact();
      }
    }
  }

  ngOnDestroy(): void {
    this.workspaceStore.clearMemberRemovalImpact();
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

    const impact = this.workspaceStore.memberRemovalImpact();
    if (
      !this.isOpen ||
      this.workspaceStore.isRemovingMember() ||
      this.workspaceStore.isLoadingMemberImpact() ||
      !impact ||
      impact.memberId !== this.member.userId ||
      impact.isProjectLeader
    ) {
      return;
    }

    const targetUserId = this.member.userId;
    const workspaceId = this.workspaceId;

    this.workspaceStore.removeMember(
      workspaceId,
      targetUserId,
      () => {
        if (
          !this.isOpen ||
          this.workspaceId !== workspaceId ||
          this.member?.userId !== targetUserId
        )
          return;
        this.memberRemoved.emit({ memberId: targetUserId, workspaceId });

        this.close();
      },
      () => {},
    );
  }
}
