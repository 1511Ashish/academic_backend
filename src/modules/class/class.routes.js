import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { tenantMiddleware } from '../../core/tenant.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import {
  createClassController,
  getClassesController,
  getClassController,
  updateClassController,
  deleteClassController,
  getClassesByTeacherController,
} from './class.controller.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/teacher/:teacherId', getClassesByTeacherController);
router.get('/', getClassesController);
router.post('/', roleMiddleware('schooladmin'), createClassController);
router.get('/:id', getClassController);
router.put('/:id', roleMiddleware('schooladmin'), updateClassController);
router.delete('/:id', roleMiddleware('schooladmin'), deleteClassController);

export default router;
