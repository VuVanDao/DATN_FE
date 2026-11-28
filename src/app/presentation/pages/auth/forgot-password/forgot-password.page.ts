import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../../application/state/auth.store';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './forgot-password.page.html',
})
export class ForgotPasswordPage {
  private readonly router = inject(Router);
  readonly authStore = inject(AuthStore);

  readonly isSubmitting = this.authStore.isForgettingPassword;

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
    this.authStore.forgotPassword({ email: email }, () => {
      this.router.navigate(['/reset-password'], {
        queryParams: { email },
      });
    });
  }
}
