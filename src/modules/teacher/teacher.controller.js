import {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  searchTeachers,
  getTeachersByRole,
} from './teacher.service.js';
import { success } from '../../utils/response.js';
import { uploadToCloudinary } from '../../middleware/upload.middleware.js';

export async function createTeacherController(req, res, next) {
  try {
    const payload = { ...req.body };
    if (req.file?.buffer) {
      payload.picture = await uploadToCloudinary(req.file.buffer, 'teachers');
    }
    const teacher = await createTeacher(payload, req.tenantId);
    return success(res, teacher, 'Teacher created', 201);
  } catch (err) {
    return next(err);
  }
}

export async function getTeachersController(req, res, next) {
  try {
    const teachers = await getTeachers(req.tenantId, req.query);
    return success(res, teachers, 'Teachers fetched');
  } catch (err) {
    return next(err);
  }
}

export async function getTeacherController(req, res, next) {
  try {
    const teacher = await getTeacherById(req.params.id, req.tenantId);
    return success(res, teacher, 'Teacher fetched');
  } catch (err) {
    return next(err);
  }
}

export async function updateTeacherController(req, res, next) {
  try {
    const updates = { ...req.body };
    if (req.file?.buffer) {
      updates.picture = await uploadToCloudinary(req.file.buffer, 'teachers');
    }
    const teacher = await updateTeacher(req.params.id, req.tenantId, updates);
    return success(res, teacher, 'Teacher updated');
  } catch (err) {
    return next(err);
  }
}

export async function deleteTeacherController(req, res, next) {
  try {
    const teacher = await deleteTeacher(req.params.id, req.tenantId);
    return success(res, teacher, 'Teacher soft deleted');
  } catch (err) {
    return next(err);
  }
}

export async function searchTeachersController(req, res, next) {
  try {
    const teachers = await searchTeachers(req.tenantId, req.query);
    return success(res, teachers, 'Teachers fetched');
  } catch (err) {
    return next(err);
  }
}

export async function getTeachersByRoleController(req, res, next) {
  try {
    const teachers = await getTeachersByRole(req.params.role, req.tenantId, req.query);
    return success(res, teachers, 'Teachers fetched');
  } catch (err) {
    return next(err);
  }
}
