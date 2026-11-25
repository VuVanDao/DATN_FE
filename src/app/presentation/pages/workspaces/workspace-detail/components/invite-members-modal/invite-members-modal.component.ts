import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
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
import { Router } from '@angular/router';
import { WorkspaceStore } from '../../../../../../application/state/workspace.store';
import { AddWorkspaceMembersResult } from '../../../../../../domain/models/workspace.model';

interface MemberRow {
  email: string;
  error?: string | null;
}

@Component({
  selector: 'app-invite-members-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './invite-members-modal.component.html',
})
export class InviteMembersModalComponent implements OnChanges {
  readonly workspaceStore = inject(WorkspaceStore);
  private readonly router = inject(Router);
  @Input() isOpen = false;
  @Input() workspaceId = '';
  @Output() closed = new EventEmitter<void>();
  @Output() membersAdded = new EventEmitter<AddWorkspaceMembersResult>();

  // Danh sách rows nhập email
  readonly rows = signal<MemberRow[]>([{ email: '' }]);
  // Kết quả sau khi gửi API
  readonly addResult = signal<AddWorkspaceMembersResult | null>(null);
  // Thông báo lỗi nếu gửi thất bại
  readonly submitError = signal<string | null>(null);

  readonly isNotFoundError = computed(() => {
    const err = (this.submitError() || '').toLowerCase();
    return (
      err.includes('không tồn tại') ||
      err.includes('not found') ||
      err.includes('không tìm thấy') ||
      err.includes('workspace')
    );
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true || changes['workspaceId']) {
      this.resetState();
    }
  }

  // add member to form to add
  addRow(): void {
    if (this.rows().length >= 10) return;
    this.rows.update((rows) => {
      return [...rows, { email: '' }];
    });
  }

  // remove member to form to add
  removeRow(index: number): void {
    if (this.rows().length <= 1) return;
    this.rows.update((rows) => rows.filter((row, i) => i !== index));
  }

  close(): void {
    this.resetState();
    this.closed.emit();
  }

  goToHome(): void {
    this.close();
    void this.router.navigate(['/home-page']);
  }

  private resetState(): void {
    this.rows.set([{ email: '' }]);
    this.addResult.set(null);
    this.submitError.set(null);
  }

  private validateRows(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let valid = true;
    const seenEmails = new Set<string>();
    const validated = this.rows().map((row) => {
      const email = row.email.trim().toLowerCase();
      if (!row.email.trim()) {
        valid = false;
        return { ...row, error: 'Email không được để trống.' };
      }
      if (!emailRegex.test(row.email.trim())) {
        valid = false;
        return { ...row, error: 'Email không đúng định dạng.' };
      }
      if (seenEmails.has(email)) {
        valid = false;
        return { ...row, error: 'Email bị trùng trong danh sách.' };
      }
      seenEmails.add(email);
      return { ...row, error: null };
    });
    this.rows.set(validated);
    return valid;
  }

  submit(): void {
    if (!this.isOpen || this.workspaceStore.isAddingMembers() || !this.validateRows()) return;
    const workspaceId = this.workspaceId;
    const members = this.rows().map((row) => ({
      email: row.email.trim(),
    }));
    this.submitError.set(null);
    this.workspaceStore.addMembers(
      workspaceId,
      { members },
      (result) => {
        if (!this.isOpen || this.workspaceId !== workspaceId) return;
        this.addResult.set(result);
        this.membersAdded.emit(result);
        // Đóng ngay sau khi thành công để không giữ timer của lần mở trước.
        if (result.totalFailed === 0) {
          this.close();
        }
      },
      (errorMsg) => {
        if (!this.isOpen || this.workspaceId !== workspaceId) return;
        this.submitError.set(errorMsg);
      },
    );
  }
}
