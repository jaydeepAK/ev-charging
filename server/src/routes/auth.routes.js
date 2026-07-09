import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', requireAuth, getProfile); // protected: needs a valid token

export default router;
