import { Router } from 'express';
import tenantRoutes from '../modules/tenant/tenant.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/user/user.routes.js';
import studentRoutes from '../modules/student/student.routes.js';
import teacherRoutes from '../modules/teacher/teacher.routes.js';
import classRoutes from '../modules/class/class.routes.js';
import attendanceRoutes from '../modules/attendance/attendance.routes.js';

const router = Router();

router.use('/tenants', tenantRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/classes', classRoutes);
router.use('/attendance', attendanceRoutes);

export default router;
