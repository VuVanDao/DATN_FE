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
import { WorkspaceStore } from '../../state/workspace.store';
import { AddWorkspaceMembersResponse, WorkspaceRole } from '../../../domain/models/workspace.model';
interface MemberRow {
  email: string;
  roleId: string | null;
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
  @Input() isOpen = false;
  @Input() workspaceId = '';
  @Output() closed = new EventEmitter<void>();
  @Output() membersAdded = new EventEmitter<AddWorkspaceMembersResponse>();

  // Danh sách rows nhập email + role
  readonly rows = signal<MemberRow[]>([{ email: '', roleId: null }]);
  // Kết quả sau khi gửi API
  readonly addResult = signal<AddWorkspaceMembersResponse | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true) {
      this.workspaceStore.loadWorkspaceRoles();
      this.resetState();
    }
  }
  get roles(): WorkspaceRole[] {
    return this.workspaceStore.workspaceRoles();
  }
  // add member to form to add
  addRow(): void {
    if (this.rows().length >= 10) return;
    this.rows.update((rows) => {
      return [...rows, { email: '', roleId: null }];
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
  private resetState(): void {
    this.rows.set([{ email: '', roleId: null }]);
    this.addResult.set(null);
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
    if (!this.validateRows()) return;
    const members = this.rows().map((row) => ({
      email: row.email.trim(),
      roleId: row.roleId || null,
    }));
    this.workspaceStore.addMembers(this.workspaceId, { members: members }, (result) => {
      this.addResult.set(result);
      this.membersAdded.emit(result);
      // Nếu tất cả đều thành công thì tự đóng modal sau 1.5s
      if (result.totalFailed === 0) {
        setTimeout(() => this.close(), 1500);
      }
    });
  }
}
