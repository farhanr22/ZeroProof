import { Router } from 'express';
import authRoutes from './auth.routes.js';
import campaignsRoutes from './campaigns.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/campaigns', campaignsRoutes);

export default router;
