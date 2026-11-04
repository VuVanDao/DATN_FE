import { CommonModule } from '@angular/common';
import { Component, effect, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-card-description',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './card-description.component.html',
})
export class CardDescriptionComponent {
  readonly description = input<string | null>('');
  readonly descriptionSaved = output<string>();

  readonly isEditing = signal<boolean>(false);
  readonly currentText = signal<string>('');

  readonly textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('descriptionInput');

  constructor() {
    effect(() => {
      this.currentText.set(this.description() || '');
    });
  }

  startEditing(): void {
    this.currentText.set(this.description() || '');
    this.isEditing.set(true);
    setTimeout(() => {
      this.textareaRef()?.nativeElement.focus();
    }, 50);
  }

  cancelEditing(): void {
    this.currentText.set(this.description() || '');
    this.isEditing.set(false);
  }

  save(): void {
    this.isEditing.set(false);
    this.descriptionSaved.emit(this.currentText().trim());
  }
}
