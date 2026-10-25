import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AiMessage } from '../../domain/models/ai.model';
import { AiRepository } from '../../domain/repositories/ai.repository';
@Injectable({ providedIn: 'root' })
export class AiAssistantService {
  private readonly repository = inject(AiRepository);
  getInitialMessages(): AiMessage[] {
    return this.repository.getInitialMessages();
  }
  getSuggestedPrompts(): string[] {
    return this.repository.getSuggestedPrompts();
  }
  sendMessage(message: string): Observable<AiMessage> {
    return this.repository.sendMessage(message);
  }
}
