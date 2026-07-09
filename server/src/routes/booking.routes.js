import { Router } from 'express';
import { createBooking, listBookings, updateBooking } from '../controllers/booking.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, requireRole('CUSTOMER'), createBooking);
router.get('/', requireAuth, listBookings); // scoped by role inside the controller
router.put('/:id', requireAuth, updateBooking);

export default router;
