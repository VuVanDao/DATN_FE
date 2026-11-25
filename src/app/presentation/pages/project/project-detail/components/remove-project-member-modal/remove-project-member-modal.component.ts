import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ProjectMember } from '../../../../../../domain/models/project.model';

@Component({
  selector: 'app-remove-project-member-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './remove-project-member-modal.component.html',
})
export class RemoveProjectMemberModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly member = input<ProjectMember | null>(null);
  readonly projectName = input<string>('');
  readonly isSelf = input<boolean>(false);
  readonly isRemoving = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);

  readonly closed = output<void>();
  readonly confirmed = output<void>();

  onClose(): void {
    if (this.isRemoving()) return;
    this.closed.emit();
  }

  onConfirm(): void {
    if (this.isRemoving()) return;
    this.confirmed.emit();
  }
}
