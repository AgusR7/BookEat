export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (password.length < 8) {
    return { isValid: false, error: 'La contraseña debe tener al menos 8 caracteres' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'La contraseña debe contener al menos una mayúscula' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'La contraseña debe contener al menos una minúscula' };
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, error: 'La contraseña debe contener al menos un carácter especial' };
  }

  return { isValid: true };
}; 