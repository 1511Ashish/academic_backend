import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { tenantMiddleware } from '../../core/tenant.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import {
  createAttendanceController,
  listAttendanceController,
  getAttendanceController,
  updateAttendanceController,
  deleteAttendanceController,
} from './attendance.controller.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', listAttendanceController);
router.post('/', roleMiddleware('schooladmin', 'teacher'), createAttendanceController);
router.get('/:id', getAttendanceController);
router.put('/:id', roleMiddleware('schooladmin', 'teacher'), updateAttendanceController);
router.delete('/:id', roleMiddleware('schooladmin'), deleteAttendanceController);

export default router;
