import { Observable } from 'rxjs';
import { AiMessage } from '../models/ai.model';
export abstract class AiRepository {
  abstract getInitialMessages(): AiMessage[];
  abstract getSuggestedPrompts(): string[];
  abstract sendMessage(message: string): Observable<AiMessage>;
}
