import { Router } from 'express';
import { registerTenantController } from './tenant.controller.js';

const router = Router();

router.post('/register', registerTenantController);

export default router;
