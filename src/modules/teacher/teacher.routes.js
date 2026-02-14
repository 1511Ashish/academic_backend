import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { tenantMiddleware } from '../../core/tenant.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import { upload } from '../../middleware/upload.middleware.js';
import {
  createTeacherController,
  getTeachersController,
  getTeacherController,
  updateTeacherController,
  deleteTeacherController,
  searchTeachersController,
  getTeachersByRoleController,
} from './teacher.controller.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/search', searchTeachersController);
router.get('/role/:role', getTeachersByRoleController);
router.get('/', getTeachersController);
router.post('/', roleMiddleware('schooladmin'), upload.single('picture'), createTeacherController);
router.get('/:id', getTeacherController);
router.put('/:id', roleMiddleware('schooladmin'), upload.single('picture'), updateTeacherController);
router.delete('/:id', roleMiddleware('schooladmin'), deleteTeacherController);

export default router;
