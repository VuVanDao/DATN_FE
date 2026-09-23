import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { toast } from 'ngx-sonner';
import { AuthStore } from '../../state/auth.store';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './forgot-password.html',
})
export class ForgotPasswordPage {
  private readonly router = inject(Router);
  readonly authStore = inject(AuthStore);

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
    this.authStore.forgotPassword(
      { email: email },
      () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/reset-password'], {
          queryParams: { email },
        });
      },
      () => {
        this.isSubmitting.set(false);
      },
    );
  }
}
