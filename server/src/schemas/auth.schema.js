import { z } from 'zod';

export const authCredentialsSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(255)
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(255)
});
