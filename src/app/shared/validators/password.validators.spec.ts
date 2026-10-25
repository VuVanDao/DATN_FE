import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  accountPasswordValidators,
  matchingPasswords,
  newPasswordValidators,
} from './password.validators';

describe('Password forms', () => {
  it('reports mismatch on the group without changing required errors', () => {
    const form = new FormGroup(
      {
        password: new FormControl('Secret1!'),
        confirmation: new FormControl('', Validators.required),
      },
      {
        validators: matchingPasswords('password', 'confirmation'),
      },
    );
    expect(form.controls.confirmation.hasError('required')).toBe(true);
    form.controls.confirmation.setValue('different');
    expect(form.hasError('passwordMismatch')).toBe(true);
    form.controls.confirmation.setValue('Secret1!');
    expect(form.valid).toBe(true);
    form.controls.confirmation.setValue('');
    expect(form.controls.confirmation.hasError('required')).toBe(true);
    expect(form.hasError('passwordMismatch')).toBe(false);
  });

  it('matches the distinct account-creation and password-change contracts', () => {
    expect(new FormControl('abcdef', accountPasswordValidators).valid).toBe(true);
    expect(new FormControl('abcdef', newPasswordValidators).valid).toBe(false);
    expect(new FormControl('Abc1!x', newPasswordValidators).valid).toBe(true);
    expect(new FormControl('x'.repeat(51), accountPasswordValidators).valid).toBe(false);
  });
});
