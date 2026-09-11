import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../state/auth.store';
import { LayoutService } from '../../../application/layout/layout.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MatTooltipModule, MatIconModule],
  templateUrl: './profile.html',
})
export class ProfilePage implements OnInit {
  readonly authStore = inject(AuthStore);
  readonly layoutService = inject(LayoutService);

  readonly isEditMode = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly isCopied = signal<boolean>(false);
  readonly showSuccessAlert = signal<boolean>(false);

  readonly form = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    bio: new FormControl('', { nonNullable: true }),
  });

  get usernameControl() {
    return this.form.controls.username;
  }
  get bioControl() {
    return this.form.controls.bio;
  }

  ngOnInit(): void {
    this.layoutService.setSidebar('settings');
    this.initFormData();
  }

  private initFormData(): void {
    const user = this.authStore.currentUser();
    if (user) {
      this.form.patchValue({
        username: user.UserName,
        bio: user.Bio ?? '',
      });
    }
  }

  enterEditMode(): void {
    this.initFormData();
    this.isEditMode.set(true);
  }

  cancelEdit(): void {
    this.initFormData();
    this.form.markAsPristine();
    this.isEditMode.set(false);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    // Giả lập lưu (sau này tích hợp API update profile)
    setTimeout(() => {
      this.isSaving.set(false);
      this.isEditMode.set(false);
      this.showSuccessAlert.set(true);
      setTimeout(() => {
        this.showSuccessAlert.set(false);
      }, 3000);
    }, 600);
  }

  copyId(id: string | undefined): void {
    if (!id || typeof navigator === 'undefined') return;
    navigator.clipboard.writeText(id).then(() => {
      this.isCopied.set(true);
      setTimeout(() => this.isCopied.set(false), 2000);
    });
  }

  /** Badge màu thống nhất cho tất cả role */
  readonly roleBadgeClass =
    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
}
