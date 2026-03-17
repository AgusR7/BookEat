import { Router } from 'express';
import {
  createReservation,
  getReservations,
  deleteReservation
} from '../controllers/reservations.controller';
import { ensureAuthenticated } from '../utils/auth';

const router = Router();
router.post('/', ensureAuthenticated, createReservation);
router.get('/', ensureAuthenticated, getReservations);
router.delete('/:id', ensureAuthenticated, deleteReservation);

export default router;
