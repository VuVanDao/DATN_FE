import { CommonModule } from '@angular/common';
import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CardDetailActivity } from '../card-detail.types';

@Component({
  selector: 'app-card-activity-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './card-activity-feed.component.html',
  host: {
    class: 'block',
  },
})
export class CardActivityFeedComponent {
  readonly activities = input<CardDetailActivity[]>([]);
  readonly currentUserAvatar = input<string | null | undefined>(null);
  readonly currentUserName = input<string>('Tôi');
  readonly isLoading = input<boolean>(false);

  readonly commentAdded = output<string>();

  readonly isWritingComment = signal<boolean>(false);
  readonly newCommentText = signal<string>('');
  readonly showDetails = signal<boolean>(true);

  readonly commentInputRef = viewChild<ElementRef<HTMLTextAreaElement>>('commentInput');

  startWritingComment(): void {
    this.isWritingComment.set(true);
    setTimeout(() => {
      this.commentInputRef()?.nativeElement.focus();
    }, 50);
  }

  cancelComment(): void {
    this.newCommentText.set('');
    this.isWritingComment.set(false);
  }

  saveComment(): void {
    const text = this.newCommentText().trim();
    if (!text) return;
    this.commentAdded.emit(text);
    this.newCommentText.set('');
    this.isWritingComment.set(false);
  }

  toggleShowDetails(): void {
    this.showDetails.update((v) => !v);
  }
}
