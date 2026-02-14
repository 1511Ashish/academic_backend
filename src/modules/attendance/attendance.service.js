import { Attendance } from './attendance.model.js';
import { ApiError } from '../../utils/response.js';

export async function createAttendance(payload) {
  if (!payload.studentId || !payload.classId || !payload.date || !payload.status || !payload.tenantId) {
    throw new ApiError(400, 'Missing required fields');
  }
  return Attendance.create(payload);
}

export async function listAttendance(tenantId) {
  return Attendance.find({ tenantId });
}

export async function getAttendanceById(id, tenantId) {
  const record = await Attendance.findOne({ _id: id, tenantId });
  if (!record) {
    throw new ApiError(404, 'Attendance not found');
  }
  return record;
}

export async function updateAttendance(id, tenantId, updates) {
  const record = await Attendance.findOneAndUpdate(
    { _id: id, tenantId },
    updates,
    { new: true }
  );
  if (!record) {
    throw new ApiError(404, 'Attendance not found');
  }
  return record;
}

export async function deleteAttendance(id, tenantId) {
  const record = await Attendance.findOneAndDelete({ _id: id, tenantId });
  if (!record) {
    throw new ApiError(404, 'Attendance not found');
  }
  return record;
}
