import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { GetMyLoginHistoryUseCase } from '../../../../../application/security/get-my-login-history.use-case';
import { LoginHistory } from '../../../../../domain/models/user.model';

type HistoryFilter = 'all' | 'success' | 'failed';

@Component({
  selector: 'app-login-history',
  standalone: true,
  imports: [DatePipe, MatIconModule],
  templateUrl: './login-history.component.html',
})
export class LoginHistoryComponent {
  private readonly getMyLoginHistoryUseCase = inject(GetMyLoginHistoryUseCase);

  readonly histories = signal<LoginHistory[]>([]);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly filter = signal<HistoryFilter>('all');
  readonly showAll = signal(false);
  readonly visibleHistories = computed(() => {
    const selected = this.filter();
    const filtered = this.histories().filter((item) => {
      if (selected === 'success') return item.isSuccess;
      if (selected === 'failed') return !item.isSuccess;
      return true;
    });
    return this.showAll() ? filtered : filtered.slice(0, 5);
  });
  readonly filteredCount = computed(() => {
    const selected = this.filter();
    if (selected === 'all') return this.histories().length;
    return this.histories().filter((item) => (selected === 'success' ? item.isSuccess : !item.isSuccess))
      .length;
  });

  constructor() {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.getMyLoginHistoryUseCase.execute().subscribe({
      next: (histories) => {
        this.histories.set(histories);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  setFilter(filter: HistoryFilter): void {
    this.filter.set(filter);
    this.showAll.set(false);
  }

  toggleShowAll(): void {
    this.showAll.update((value) => !value);
  }

  deviceLabel(userAgent?: string | null): string {
    if (!userAgent) return 'Thiết bị không xác định';
    if (/edg/i.test(userAgent)) return 'Microsoft Edge';
    if (/firefox/i.test(userAgent)) return 'Mozilla Firefox';
    if (/chrome|crios/i.test(userAgent)) return 'Google Chrome';
    if (/safari/i.test(userAgent)) return 'Safari';
    return 'Trình duyệt khác';
  }

  platformLabel(userAgent?: string | null): string {
    if (!userAgent) return 'Không có thông tin thiết bị';
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/android/i.test(userAgent)) return 'Android';
    if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
    if (/mac os/i.test(userAgent)) return 'macOS';
    if (/linux/i.test(userAgent)) return 'Linux';
    return 'Hệ điều hành không xác định';
  }
}
