import { ClassModel } from './class.model.js';
import { Teacher } from '../teacher/teacher.model.js';
import { ApiError } from '../../utils/response.js';
import {
  validateClassId,
  validateClassQuery,
  validateCreateClassPayload,
  validateTeacherId,
  validateUpdateClassPayload,
} from './class.validator.js';

async function ensureTeacherExists(teacherId, tenantId) {
  const teacher = await Teacher.exists({ _id: teacherId, tenantId, isActive: true });
  if (!teacher) {
    throw new ApiError(404, 'Class teacher not found');
  }
}

function teacherPopulate(query) {
  return query.populate('classTeacher', 'employeeName employeeId mobileNumber');
}

function buildClassFilter(tenantId, options = {}) {
  const filter = { tenantId };

  if (!options.includeInactive) {
    filter.isActive = true;
  }

  if (options.academicYear) {
    filter.academicYear = options.academicYear;
  }

  if (options.classTeacher) {
    filter.classTeacher = options.classTeacher;
  }

  if (options.q) {
    filter.className = new RegExp(options.q, 'i');
  }

  return filter;
}

function buildPaginationMeta(page, limit, total) {
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

export async function createClass(payload, tenantId) {
  if (!tenantId) {
    throw new ApiError(400, 'Missing tenant context');
  }

  const normalizedPayload = validateCreateClassPayload(payload);
  await ensureTeacherExists(normalizedPayload.classTeacher, tenantId);

  const created = await ClassModel.create({
    ...normalizedPayload,
    tenantId,
  });

  return teacherPopulate(ClassModel.findById(created._id));
}

export async function getClasses(tenantId, query = {}) {
  if (!tenantId) {
    throw new ApiError(400, 'Missing tenant context');
  }

  const options = validateClassQuery(query);
  const filter = buildClassFilter(tenantId, options);
  const sortDirection = options.sortOrder === 'asc' ? 1 : -1;

  const [items, total] = await Promise.all([
    teacherPopulate(
      ClassModel.find(filter)
        .sort({ [options.sortBy]: sortDirection })
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
    ),
    ClassModel.countDocuments(filter),
  ]);

  return {
    items,
    pagination: buildPaginationMeta(options.page, options.limit, total),
  };
}

export async function getClassById(id, tenantId) {
  validateClassId(id);

  const cls = await teacherPopulate(ClassModel.findOne({ _id: id, tenantId, isActive: true }));
  if (!cls) {
    throw new ApiError(404, 'Class not found');
  }
  return cls;
}

export async function updateClass(id, tenantId, updates) {
  validateClassId(id);
  const normalizedUpdates = validateUpdateClassPayload(updates);

  if (normalizedUpdates.classTeacher) {
    await ensureTeacherExists(normalizedUpdates.classTeacher, tenantId);
  }

  const cls = await ClassModel.findOneAndUpdate(
    { _id: id, tenantId, isActive: true },
    normalizedUpdates,
    { new: true, runValidators: true }
  );

  if (!cls) {
    throw new ApiError(404, 'Class not found');
  }

  return teacherPopulate(ClassModel.findById(cls._id));
}

export async function deleteClass(id, tenantId) {
  validateClassId(id);

  const cls = await ClassModel.findOneAndUpdate(
    { _id: id, tenantId, isActive: true },
    { isActive: false },
    { new: true }
  );

  if (!cls) {
    throw new ApiError(404, 'Class not found');
  }

  return cls;
}

export async function getClassesByTeacher(teacherId, tenantId, query = {}) {
  const validatedTeacherId = validateTeacherId(teacherId);
  await ensureTeacherExists(validatedTeacherId, tenantId);

  return getClasses(tenantId, { ...query, classTeacher: validatedTeacherId });
}
