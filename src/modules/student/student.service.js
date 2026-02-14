import { Student } from './student.model.js';
import mongoose from 'mongoose';
import { ClassModel } from '../class/class.model.js';
import { ApiError } from '../../utils/response.js';
import {
  validateCreateStudentPayload,
  validateStudentId,
  validateStudentListQuery,
  validateUpdateStudentPayload,
} from './student.validation.js';

async function ensureClassExists(classId, tenantId) {
  const cls = await ClassModel.exists({ _id: classId, tenantId });
  if (!cls) {
    throw new ApiError(404, 'Class not found');
  }
}

function buildListFilter(tenantId, options) {
  const filter = { tenantId };

  if (!options.includeInactive) {
    filter.isActive = true;
  }

  if (options.classId) {
    filter.classId = options.classId;
  }

  if (options.q) {
    const pattern = new RegExp(options.q, 'i');
    filter.$or = [
      { studentName: pattern },
      { registrationNo: pattern },
      { mobileNumber: pattern },
    ];
  }

  return filter;
}

export async function createStudent(payload, tenantId) {
  if (!tenantId) {
    throw new ApiError(400, 'Missing tenant context');
  }

  const normalizedPayload = validateCreateStudentPayload(payload);
  await ensureClassExists(normalizedPayload.classId, tenantId);

  const student = await Student.create({
    ...normalizedPayload,
    tenantId,
  });

  return Student.findById(student._id).populate('classId');
}

export async function listStudents(tenantId, query = {}) {
  if (!tenantId) {
    throw new ApiError(400, 'Missing tenant context');
  }

  const options = validateStudentListQuery(query);
  const filter = buildListFilter(tenantId, options);
  const sortDirection = options.sortOrder === 'asc' ? 1 : -1;

  const [items, total] = await Promise.all([
    Student.find(filter)
      .sort({ [options.sortBy]: sortDirection })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .populate('classId')
      .populate('familyId'),
    Student.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / options.limit));

  return {
    items,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages,
      hasNext: options.page < totalPages,
      hasPrev: options.page > 1,
    },
  };
}

export async function getStudentById(id, tenantId) {
  validateStudentId(id);

  const student = await Student.findOne({ _id: id, tenantId, isActive: true })
    .populate('classId')
    .populate('familyId');

  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  return student;
}

export async function updateStudent(id, tenantId, updates) {
  validateStudentId(id);
  const normalizedUpdates = validateUpdateStudentPayload(updates);

  if (normalizedUpdates.classId) {
    await ensureClassExists(normalizedUpdates.classId, tenantId);
  }

  const student = await Student.findOneAndUpdate(
    { _id: id, tenantId, isActive: true },
    normalizedUpdates,
    { new: true, runValidators: true }
  );

  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  return Student.findById(student._id).populate('classId').populate('familyId');
}

export async function deleteStudent(id, tenantId) {
  validateStudentId(id);

  const student = await Student.findOneAndUpdate(
    { _id: id, tenantId, isActive: true },
    { isActive: false },
    { new: true }
  );

  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  return student;
}

export async function getStudentsByClass(classId, tenantId, query = {}) {
  if (!tenantId) {
    throw new ApiError(400, 'Missing tenant context');
  }

  if (!classId) {
    throw new ApiError(400, 'classId is required');
  }

  if (!mongoose.isValidObjectId(classId)) {
    throw new ApiError(400, 'Invalid class id');
  }

  await ensureClassExists(classId, tenantId);

  return listStudents(tenantId, { ...query, classId });
}

export async function searchStudents(tenantId, query = {}) {
  const q = typeof query.q === 'string' ? query.q.trim() : '';

  if (!q) {
    throw new ApiError(400, 'q is required');
  }

  return listStudents(tenantId, { ...query, q });
}
