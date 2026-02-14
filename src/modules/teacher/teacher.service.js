import { Teacher } from './teacher.model.js';
import { ApiError } from '../../utils/response.js';
import {
  validateCreateTeacherPayload,
  validateTeacherId,
  validateTeacherQuery,
  validateTeacherRole,
  validateUpdateTeacherPayload,
} from './teacher.validator.js';

function buildTeacherFilter(tenantId, options = {}) {
  const filter = { tenantId };

  if (!options.includeInactive) {
    filter.isActive = true;
  }

  if (options.role) {
    filter.role = options.role;
  }

  if (options.status) {
    filter.status = options.status;
  }

  if (options.q) {
    const pattern = new RegExp(options.q, 'i');
    filter.$or = [
      { employeeName: pattern },
      { employeeId: pattern },
      { mobileNumber: pattern },
      { email: pattern },
    ];
  }

  return filter;
}

function paginationMeta(page, limit, total) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export async function createTeacher(payload, tenantId) {
  if (!tenantId) {
    throw new ApiError(400, 'Missing tenant context');
  }

  const normalizedPayload = validateCreateTeacherPayload(payload);
  const teacher = await Teacher.create({ ...normalizedPayload, tenantId });

  return Teacher.findById(teacher._id);
}

export async function getTeachers(tenantId, query = {}) {
  if (!tenantId) {
    throw new ApiError(400, 'Missing tenant context');
  }

  const options = validateTeacherQuery(query);
  const filter = buildTeacherFilter(tenantId, options);
  const sortDirection = options.sortOrder === 'asc' ? 1 : -1;

  const [items, total] = await Promise.all([
    Teacher.find(filter)
      .sort({ [options.sortBy]: sortDirection })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit),
    Teacher.countDocuments(filter),
  ]);

  return {
    items,
    pagination: paginationMeta(options.page, options.limit, total),
  };
}

export async function getTeacherById(id, tenantId) {
  validateTeacherId(id);

  const teacher = await Teacher.findOne({ _id: id, tenantId, isActive: true });
  if (!teacher) {
    throw new ApiError(404, 'Teacher not found');
  }
  return teacher;
}

export async function updateTeacher(id, tenantId, updates) {
  validateTeacherId(id);
  const normalizedUpdates = validateUpdateTeacherPayload(updates);

  const teacher = await Teacher.findOneAndUpdate(
    { _id: id, tenantId, isActive: true },
    normalizedUpdates,
    { new: true, runValidators: true }
  );

  if (!teacher) {
    throw new ApiError(404, 'Teacher not found');
  }

  return teacher;
}

export async function deleteTeacher(id, tenantId) {
  validateTeacherId(id);

  const teacher = await Teacher.findOneAndUpdate(
    { _id: id, tenantId, isActive: true },
    { isActive: false, status: 'Inactive' },
    { new: true }
  );

  if (!teacher) {
    throw new ApiError(404, 'Teacher not found');
  }

  return teacher;
}

export async function searchTeachers(tenantId, query = {}) {
  const q = typeof query.q === 'string' ? query.q.trim() : '';

  if (!q) {
    throw new ApiError(400, 'q is required');
  }

  return getTeachers(tenantId, { ...query, q });
}

export async function getTeachersByRole(role, tenantId, query = {}) {
  const normalizedRole = validateTeacherRole(role);
  return getTeachers(tenantId, { ...query, role: normalizedRole });
}
