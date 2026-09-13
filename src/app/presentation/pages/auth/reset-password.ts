import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { toast } from 'ngx-sonner';

export const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const newPass = control.get('newPassword')?.value;
  const confirmPass = control.get('confirmPassword')?.value;
  if (!newPass || !confirmPass) return null;
  return newPass === confirmPass ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule],
  templateUrl: './reset-password.html',
})
export class ResetPasswordPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly targetEmail = signal<string>('dao@gmail.com');
  readonly isSubmitting = signal<boolean>(false);
  readonly showNewPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);

  readonly resetForm = new FormGroup(
    {
      token: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(10)],
      }),
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: passwordMatchValidator },
  );

  get tokenControl() {
    return this.resetForm.controls.token;
  }
  get newPasswordControl() {
    return this.resetForm.controls.newPassword;
  }
  get confirmPasswordControl() {
    return this.resetForm.controls.confirmPassword;
  }

  ngOnInit(): void {
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    if (emailParam) {
      this.targetEmail.set(emailParam);
    }
    const tokenParam = this.route.snapshot.queryParamMap.get('token');
    if (tokenParam) {
      this.resetForm.patchValue({ token: tokenParam });
    }
  }

  toggleShowNewPassword(): void {
    this.showNewPassword.update((v) => !v);
  }

  toggleShowConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  async pasteTokenFromClipboard(): Promise<void> {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          this.resetForm.patchValue({ token: text.trim() });
          toast.success('Đã dán mã token từ bộ nhớ tạm!');
        }
      }
    } catch {
      toast.info('Vui lòng dùng phím Ctrl + V để dán mã token.');
    }
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { token, newPassword } = this.resetForm.getRawValue();
    this.isSubmitting.set(true);

    // Giao diện mẫu trước khi ghép API thật từ Backend
    setTimeout(() => {
      this.isSubmitting.set(false);
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
      this.router.navigate(['/login']);
    }, 1000);
  }
}
