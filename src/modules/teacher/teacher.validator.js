import mongoose from 'mongoose';
import { ApiError } from '../../utils/response.js';

const ROLE_SET = new Set(['Teacher', 'Admin', 'Accountant', 'Principal', 'Clerk', 'Other']);
const STATUS_SET = new Set(['Active', 'Inactive', 'On Leave']);
const GENDER_SET = new Set(['Male', 'Female', 'Other']);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ensureString(value, fieldName) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new ApiError(400, `${fieldName} must be a string`);
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function ensureDate(value, fieldName) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, `${fieldName} must be a valid date`);
  }
  return parsed;
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

function ensureEnum(value, fieldName, allowedSet) {
  const normalized = ensureString(value, fieldName);
  if (normalized === undefined) return undefined;
  if (!allowedSet.has(normalized)) {
    throw new ApiError(400, `${fieldName} is invalid`);
  }
  return normalized;
}

function ensureEmail(value) {
  const email = ensureString(value, 'email');
  if (email === undefined) return undefined;
  const normalized = email.toLowerCase();
  if (!EMAIL_REGEX.test(normalized)) {
    throw new ApiError(400, 'email must be valid');
  }
  return normalized;
}

export function validateTeacherId(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid teacher id');
  }
}

export function validateTeacherRole(role) {
  const normalized = ensureEnum(role, 'role', ROLE_SET);
  if (!normalized) {
    throw new ApiError(400, 'role is required');
  }
  return normalized;
}

export function validateCreateTeacherPayload(payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ApiError(400, 'Invalid request payload');
  }

  const normalized = normalizeTeacherPayload(payload);

  if (!normalized.employeeName) throw new ApiError(400, 'employeeName is required');
  if (!normalized.mobileNumber) throw new ApiError(400, 'mobileNumber is required');
  if (!normalized.joiningDate) throw new ApiError(400, 'joiningDate is required');
  if (!normalized.role) throw new ApiError(400, 'role is required');
  if (normalized.monthlySalary === undefined) throw new ApiError(400, 'monthlySalary is required');

  return normalized;
}

export function validateUpdateTeacherPayload(payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ApiError(400, 'Invalid request payload');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'employeeId')) {
    throw new ApiError(400, 'employeeId cannot be updated');
  }

  return normalizeTeacherPayload(payload);
}

export function validateTeacherQuery(query = {}) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);

  if (!Number.isInteger(page) || page < 1) {
    throw new ApiError(400, 'page must be a positive integer');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ApiError(400, 'limit must be an integer between 1 and 100');
  }

  const sortBySet = new Set(['createdAt', 'employeeName', 'employeeId', 'joiningDate', 'monthlySalary']);
  const sortOrderSet = new Set(['asc', 'desc']);

  const sortBy = sortBySet.has(query.sortBy) ? query.sortBy : 'createdAt';
  const sortOrder = sortOrderSet.has(query.sortOrder) ? query.sortOrder : 'desc';

  const role = query.role ? validateTeacherRole(query.role) : undefined;
  const status = query.status ? ensureEnum(query.status, 'status', STATUS_SET) : undefined;
  const q = ensureString(query.q, 'q');
  const includeInactive = ensureBoolean(query.includeInactive, 'includeInactive') ?? false;

  return {
    page,
    limit,
    sortBy,
    sortOrder,
    role,
    status,
    q,
    includeInactive,
  };
}

function normalizeTeacherPayload(payload = {}) {
  const normalized = {};

  const stringFields = [
    'employeeName',
    'picture',
    'mobileNumber',
    'fatherOrHusbandName',
    'nationalId',
    'education',
    'religion',
    'bloodGroup',
    'address',
  ];

  for (const field of stringFields) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      normalized[field] = ensureString(payload[field], field);
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'joiningDate')) {
    normalized.joiningDate = ensureDate(payload.joiningDate, 'joiningDate');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'role')) {
    normalized.role = ensureEnum(payload.role, 'role', ROLE_SET);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'monthlySalary')) {
    normalized.monthlySalary = ensureNumber(payload.monthlySalary, 'monthlySalary', 0);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'gender')) {
    normalized.gender = ensureEnum(payload.gender, 'gender', GENDER_SET);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'experience')) {
    normalized.experience = ensureNumber(payload.experience, 'experience', 0);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'email')) {
    normalized.email = ensureEmail(payload.email);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'dateOfBirth')) {
    normalized.dateOfBirth = ensureDate(payload.dateOfBirth, 'dateOfBirth');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
    normalized.status = ensureEnum(payload.status, 'status', STATUS_SET);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'isActive')) {
    normalized.isActive = ensureBoolean(payload.isActive, 'isActive');
  }

  return normalized;
}
