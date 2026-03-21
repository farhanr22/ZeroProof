import { Router } from 'express';
import authRoutes from './auth.routes.js';
import campaignsRoutes from './campaigns.routes.js';
import otpRoutes from './otp.routes.js';
import { otpAuthMiddleware } from '../../core/otp.middleware.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/campaigns', campaignsRoutes);
router.use('/otp', otpAuthMiddleware, otpRoutes);

export default router;
