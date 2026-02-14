import mongoose from 'mongoose';
import { ApiError } from '../../utils/response.js';

function ensureString(value, fieldName) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new ApiError(400, `${fieldName} must be a string`);
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function ensureNumber(value, fieldName, min = 0) {
  if (value === undefined || value === null || value === '') return undefined;
  const numeric = Number(value);
  if (Number.isNaN(numeric) || numeric < min) {
    throw new ApiError(400, `${fieldName} must be a number >= ${min}`);
  }
  return numeric;
}

function ensureBoolean(value, fieldName) {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new ApiError(400, `${fieldName} must be a boolean`);
}

function ensureObjectId(value, fieldName) {
  if (value === undefined || value === null || value === '') return undefined;
  if (!mongoose.isValidObjectId(value)) {
    throw new ApiError(400, `${fieldName} must be a valid id`);
  }
  return value;
}

export function validateClassId(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid class id');
  }
}

export function validateCreateClassPayload(payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ApiError(400, 'Invalid request payload');
  }

  const normalized = normalizeClassPayload(payload);

  if (!normalized.className) throw new ApiError(400, 'className is required');
  if (normalized.monthlyTuitionFee === undefined) throw new ApiError(400, 'monthlyTuitionFee is required');
  if (!normalized.classTeacher) throw new ApiError(400, 'classTeacher is required');

  return normalized;
}

export function validateUpdateClassPayload(payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ApiError(400, 'Invalid request payload');
  }

  return normalizeClassPayload(payload);
}

export function validateClassQuery(query = {}) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);

  if (!Number.isInteger(page) || page < 1) {
    throw new ApiError(400, 'page must be a positive integer');
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ApiError(400, 'limit must be an integer between 1 and 100');
  }

  const sortBySet = new Set(['createdAt', 'className', 'academicYear', 'monthlyTuitionFee']);
  const sortOrderSet = new Set(['asc', 'desc']);

  const sortBy = sortBySet.has(query.sortBy) ? query.sortBy : 'createdAt';
  const sortOrder = sortOrderSet.has(query.sortOrder) ? query.sortOrder : 'desc';

  return {
    page,
    limit,
    sortBy,
    sortOrder,
    q: ensureString(query.q, 'q'),
    academicYear: ensureString(query.academicYear, 'academicYear'),
    classTeacher: ensureObjectId(query.classTeacher, 'classTeacher'),
    includeInactive: ensureBoolean(query.includeInactive, 'includeInactive') ?? false,
  };
}

export function validateTeacherId(teacherId) {
  const normalized = ensureObjectId(teacherId, 'teacherId');
  if (!normalized) {
    throw new ApiError(400, 'teacherId is required');
  }
  return normalized;
}

function normalizeClassPayload(payload = {}) {
  const normalized = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'className')) {
    normalized.className = ensureString(payload.className, 'className');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'monthlyTuitionFee')) {
    normalized.monthlyTuitionFee = ensureNumber(payload.monthlyTuitionFee, 'monthlyTuitionFee', 0);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'classTeacher')) {
    normalized.classTeacher = ensureObjectId(payload.classTeacher, 'classTeacher');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'classCode')) {
    normalized.classCode = ensureString(payload.classCode, 'classCode');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
    normalized.description = ensureString(payload.description, 'description');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'academicYear')) {
    normalized.academicYear = ensureString(payload.academicYear, 'academicYear');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'maxStudents')) {
    normalized.maxStudents = ensureNumber(payload.maxStudents, 'maxStudents', 0);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'isActive')) {
    normalized.isActive = ensureBoolean(payload.isActive, 'isActive');
  }

  return normalized;
}
