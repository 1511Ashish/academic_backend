import {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  getClassesByTeacher,
} from './class.service.js';
import { success } from '../../utils/response.js';

export async function createClassController(req, res, next) {
  try {
    const payload = { ...req.body };
    const cls = await createClass(payload, req.tenantId);
    return success(res, cls, 'Class created', 201);
  } catch (err) {
    return next(err);
  }
}

export async function getClassesController(req, res, next) {
  try {
    const classes = await getClasses(req.tenantId, req.query);
    return success(res, classes, 'Classes fetched');
  } catch (err) {
    return next(err);
  }
}

export async function getClassController(req, res, next) {
  try {
    const cls = await getClassById(req.params.id, req.tenantId);
    return success(res, cls, 'Class fetched');
  } catch (err) {
    return next(err);
  }
}

export async function updateClassController(req, res, next) {
  try {
    const cls = await updateClass(req.params.id, req.tenantId, req.body);
    return success(res, cls, 'Class updated');
  } catch (err) {
    return next(err);
  }
}

export async function deleteClassController(req, res, next) {
  try {
    const cls = await deleteClass(req.params.id, req.tenantId);
    return success(res, cls, 'Class soft deleted');
  } catch (err) {
    return next(err);
  }
}

export async function getClassesByTeacherController(req, res, next) {
  try {
    const classes = await getClassesByTeacher(req.params.teacherId, req.tenantId, req.query);
    return success(res, classes, 'Classes fetched');
  } catch (err) {
    return next(err);
  }
}
