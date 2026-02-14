import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { tenantMiddleware } from '../../core/tenant.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import { upload } from '../../middleware/upload.middleware.js';
import {
  createStudentController,
  listStudentsController,
  getStudentController,
  updateStudentController,
  deleteStudentController,
  getStudentsByClassController,
  searchStudentsController,
} from './student.controller.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/search', searchStudentsController);
router.get('/class/:classId', getStudentsByClassController);
router.get('/', listStudentsController);
router.post('/', roleMiddleware('schooladmin', 'teacher'), upload.single('picture'), createStudentController);
router.get('/:id', getStudentController);
router.put('/:id', roleMiddleware('schooladmin', 'teacher'), upload.single('picture'), updateStudentController);
router.delete('/:id', roleMiddleware('schooladmin'), deleteStudentController);

export default router;
