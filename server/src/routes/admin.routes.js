import { Router } from 'express';
import { getAnalytics, listAllStationsAdmin, listAllUsers } from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/analytics', requireAuth, requireRole('ADMIN'), getAnalytics);
router.get('/stations', requireAuth, requireRole('ADMIN'), listAllStationsAdmin);
router.get('/users', requireAuth, requireRole('ADMIN'), listAllUsers);

export default router;
