import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule],
  templateUrl: './forgot-password.html',
})
export class ForgotPasswordPage {
  private readonly router = inject(Router);

  readonly isSubmitting = signal<boolean>(false);

  readonly forgotForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  get emailControl() {
    return this.forgotForm.controls.email;
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    const { email } = this.forgotForm.getRawValue();
    this.isSubmitting.set(true);

    // Giao diện mẫu trước khi ghép API thật từ Backend
    setTimeout(() => {
      this.isSubmitting.set(false);
      toast.success('Mã xác nhận bảo mật đã được gửi đến email của bạn!');
      this.router.navigate(['/reset-password'], {
        queryParams: { email },
      });
    }, 800);
  }
}
