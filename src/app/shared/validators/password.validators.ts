import { ValidatorFn, Validators } from '@angular/forms';

/** Matches RegisterUser/AdminCreateUser validators in the backend. */
export const accountPasswordValidators = [
  Validators.required,
  Validators.minLength(6),
  Validators.maxLength(50),
];

/** Matches ResetPassword/ChangePassword validators in the backend. */
export const newPasswordValidators = [
  Validators.required,
  Validators.minLength(6),
  Validators.pattern(
    /^(?=[\s\S]*[a-z])(?=[\s\S]*[A-Z])(?=[\s\S]*\d)(?=[\s\S]*[^a-zA-Z0-9])[\s\S]*$/,
  ),
];

/** Reports on the group, preserving required and other errors on each field. */
export function matchingPasswords(passwordKey: string, confirmationKey: string): ValidatorFn {
  return (group) => {
    const password = group.get(passwordKey)?.value;
    const confirmation = group.get(confirmationKey)?.value;
    if (!password || !confirmation) return null;
    return password === confirmation ? null : { passwordMismatch: true };
  };
}
