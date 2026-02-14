import {
  createAttendance,
  listAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
} from './attendance.service.js';
import { success } from '../../utils/response.js';

export async function createAttendanceController(req, res, next) {
  try {
    const payload = { ...req.body, tenantId: req.tenantId };
    const record = await createAttendance(payload);
    return success(res, record, 'Attendance created', 201);
  } catch (err) {
    return next(err);
  }
}

export async function listAttendanceController(req, res, next) {
  try {
    const records = await listAttendance(req.tenantId);
    return success(res, records, 'Attendance fetched');
  } catch (err) {
    return next(err);
  }
}

export async function getAttendanceController(req, res, next) {
  try {
    const record = await getAttendanceById(req.params.id, req.tenantId);
    return success(res, record, 'Attendance fetched');
  } catch (err) {
    return next(err);
  }
}

export async function updateAttendanceController(req, res, next) {
  try {
    const record = await updateAttendance(req.params.id, req.tenantId, req.body);
    return success(res, record, 'Attendance updated');
  } catch (err) {
    return next(err);
  }
}

export async function deleteAttendanceController(req, res, next) {
  try {
    const record = await deleteAttendance(req.params.id, req.tenantId);
    return success(res, record, 'Attendance deleted');
  } catch (err) {
    return next(err);
  }
}
