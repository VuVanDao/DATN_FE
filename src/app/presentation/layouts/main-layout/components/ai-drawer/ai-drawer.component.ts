import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AiAssistantService } from '../../../../../application/ai/ai-assistant.service';
import { LayoutService } from '../../../../../application/layout/layout.service';
import { AiMessage } from '../../../../../domain/models/ai.model';

@Component({
  selector: 'app-ai-drawer',
  standalone: true,
  imports: [FormsModule, MatTooltipModule, MatIconModule],
  templateUrl: './ai-drawer.component.html',
})
export class AiDrawerComponent {
  private readonly aiService = inject(AiAssistantService);
  private readonly destroyRef = inject(DestroyRef);
  readonly layoutService = inject(LayoutService);

  readonly aiMessages = signal<AiMessage[]>(this.aiService.getInitialMessages());
  readonly suggestedPrompts = signal<string[]>(this.aiService.getSuggestedPrompts());
  readonly currentAiInput = signal<string>('');
  readonly isAiThinking = signal<boolean>(false);

  close(): void {
    this.layoutService.closeAiDrawer();
  }

  sendAiMessage(promptText?: string): void {
    const text = (promptText || this.currentAiInput()).trim();
    if (!text || this.isAiThinking()) return;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const userMsg: AiMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: timeStr,
    };

    this.aiMessages.update((msgs) => [...msgs, userMsg]);
    this.currentAiInput.set('');
    this.isAiThinking.set(true);

    this.aiService
      .sendMessage(text)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (aiReply) => {
          this.aiMessages.update((msgs) => [...msgs, aiReply]);
          this.isAiThinking.set(false);
        },
        error: () => {
          this.isAiThinking.set(false);
        },
      });
  }
}
