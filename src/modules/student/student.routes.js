import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { tenantMiddleware } from '../../core/tenant.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import { excelUpload, upload } from '../../middleware/upload.middleware.js';
import {
  createStudentController,
  listStudentsController,
  getStudentController,
  updateStudentController,
  deleteStudentController,
  getStudentsByClassController,
  searchStudentsController,
} from './student.controller.js';
import {
  getStudentMarksheetsController,
  importStudentMarksheetsController,
} from './marksheet.controller.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/marksheets', getStudentMarksheetsController);
router.post(
  '/marksheets/import',
  roleMiddleware('schooladmin', 'teacher'),
  excelUpload.single('file'),
  importStudentMarksheetsController
);
router.get('/search', searchStudentsController);
router.get('/class/:className', getStudentsByClassController);
router.get('/', listStudentsController);
router.post('/', roleMiddleware('schooladmin', 'teacher'), upload.single('picture'), createStudentController);
router.get('/:id', getStudentController);
router.put('/:id', roleMiddleware('schooladmin', 'teacher'), upload.single('picture'), updateStudentController);
router.delete('/:id', roleMiddleware('schooladmin'), deleteStudentController);

export default router;
