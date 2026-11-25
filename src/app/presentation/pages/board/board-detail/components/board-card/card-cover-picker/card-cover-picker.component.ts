import { ConnectedPosition, CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../../../../../../application/shared/notification.service';

@Component({
  selector: 'app-card-cover-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, OverlayModule],
  templateUrl: './card-cover-picker.component.html',
})
export class CardCoverPickerComponent {
  private readonly notificationService = inject(NotificationService);

  readonly origin = input.required<CdkOverlayOrigin>();
  readonly isOpen = input<boolean>(false);
  readonly currentCoverUrl = input<string | null | undefined>(null);

  readonly saveCover = output<{ coverUrl: string | null; file?: File | null }>();
  readonly removeCover = output<void>();
  readonly closed = output<void>();

  readonly coverUrlInput = signal<string>('');
  readonly previewCoverUrl = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);

  readonly overlayPositions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 4,
      offsetX: 124,
    },
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 4,
      offsetX: 124,
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -4,
      offsetX: 124,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -4,
      offsetX: 124,
    },
  ];

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const current = this.currentCoverUrl() || '';
        this.coverUrlInput.set(current);
        this.previewCoverUrl.set(current || null);
        this.selectedFile.set(null);
      }
    });
  }

  onCoverUrlChange(val: string): void {
    this.selectedFile.set(null);
    this.coverUrlInput.set(val);
    this.previewCoverUrl.set(val.trim() || null);
  }

  onCoverFileSelected(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    if (inputEl.files && inputEl.files[0]) {
      const file = inputEl.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.error('Kích thước ảnh tối đa là 5MB.');
        return;
      }
      this.selectedFile.set(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.previewCoverUrl.set(result);
        this.coverUrlInput.set(file.name);
      };
      reader.readAsDataURL(file);
    }
  }

  onSave(): void {
    const file = this.selectedFile();
    const trimmed = this.coverUrlInput().trim();
    const finalUrl = trimmed || null;
    this.closed.emit();

    if (file) {
      this.saveCover.emit({
        coverUrl: this.previewCoverUrl(),
        file,
      });
    } else {
      this.saveCover.emit({
        coverUrl: finalUrl,
      });
    }
  }

  onRemove(): void {
    this.selectedFile.set(null);
    this.coverUrlInput.set('');
    this.previewCoverUrl.set(null);
    this.closed.emit();
    this.removeCover.emit();
  }
}
