import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { tenantMiddleware } from '../../core/tenant.middleware.js';
import { roleMiddleware } from '../../middleware/role.middleware.js';
import { upload } from '../../middleware/upload.middleware.js';
import { createUserController, listUsersController } from './user.controller.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', roleMiddleware('schooladmin'), listUsersController);
router.post('/', roleMiddleware('schooladmin'), upload.single('profileImage'), createUserController);

export default router;
