import {
  createStudent,
  listStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentsByClass,
  searchStudents,
} from './student.service.js';
import { success } from '../../utils/response.js';
import { uploadToCloudinary } from '../../middleware/upload.middleware.js';

export async function createStudentController(req, res, next) {
  try {
    const payload = { ...req.body };
    if (req.file?.buffer) {
      payload.picture = await uploadToCloudinary(req.file.buffer, 'students');
    }
    const student = await createStudent(payload, req.tenantId);
    return success(res, student, 'Student created', 201);
  } catch (err) {
    return next(err);
  }
}

export async function listStudentsController(req, res, next) {
  try {
    const students = await listStudents(req.tenantId, req.query);
    return success(res, students, 'Students fetched');
  } catch (err) {
    return next(err);
  }
}

export async function getStudentController(req, res, next) {
  try {
    const student = await getStudentById(req.params.id, req.tenantId);
    return success(res, student, 'Student fetched');
  } catch (err) {
    return next(err);
  }
}

export async function updateStudentController(req, res, next) {
  try {
    const updates = { ...req.body };
    if (req.file?.buffer) {
      updates.picture = await uploadToCloudinary(req.file.buffer, 'students');
    }
    const student = await updateStudent(req.params.id, req.tenantId, updates);
    return success(res, student, 'Student updated');
  } catch (err) {
    return next(err);
  }
}

export async function deleteStudentController(req, res, next) {
  try {
    const student = await deleteStudent(req.params.id, req.tenantId);
    return success(res, student, 'Student soft deleted');
  } catch (err) {
    return next(err);
  }
}

export async function getStudentsByClassController(req, res, next) {
  try {
    const students = await getStudentsByClass(req.params.classId, req.tenantId, req.query);
    return success(res, students, 'Students fetched');
  } catch (err) {
    return next(err);
  }
}

export async function searchStudentsController(req, res, next) {
  try {
    const students = await searchStudents(req.tenantId, req.query);
    return success(res, students, 'Students fetched');
  } catch (err) {
    return next(err);
  }
}
