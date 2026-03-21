import { Router } from 'express';
import { validate } from '../../core/validate.js';
import { asyncHandler } from '../../core/errors.js';
import { sendResponse } from '../../core/response.js';
import { authMiddleware } from '../../core/auth.middleware.js';
import * as authService from '../../services/auth.service.js';
import { authCredentialsSchema, changePasswordSchema } from '../../schemas/auth.schema.js';

const router = Router();

router.post('/signup', validate(authCredentialsSchema), asyncHandler(async (req, res) => {
  req.log.info({ email: req.body.email }, 'User signup attempt');
  const result = await authService.signup(req.body.email, req.body.password);
  sendResponse(res, result, false, null, 201);
}));

router.post('/login', validate(authCredentialsSchema), asyncHandler(async (req, res) => {
  req.log.info({ email: req.body.email }, 'User login attempt');
  const result = await authService.login(req.body.email, req.body.password);
  sendResponse(res, result, false, null, 200);
}));

router.post('/change-password', authMiddleware, validate(changePasswordSchema), asyncHandler(async (req, res) => {
  req.log.info({ user_id: req.user.user_id }, 'User password change attempt');
  await authService.changePassword(req.user.user_id, req.body.oldPassword, req.body.newPassword);
  sendResponse(res, { success: true }, false, null, 200);
}));

export default router;
