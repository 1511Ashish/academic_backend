import mongoose from 'mongoose';
import { ApiError } from '../../utils/response.js';

const GENDERS = new Set(['Male', 'Female', 'Other']);

function ensureString(value, fieldName) {
  if (value === undefined || value === null) return value;
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

function ensureBoolean(value, fieldName) {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new ApiError(400, `${fieldName} must be a boolean`);
}

function ensureNonNegativeNumber(value, fieldName) {
  if (value === undefined || value === null || value === '') return undefined;
  const numeric = Number(value);
  if (Number.isNaN(numeric) || numeric < 0) {
    throw new ApiError(400, `${fieldName} must be a non-negative number`);
  }
  return numeric;
}

function ensureObjectId(value, fieldName) {
  if (value === undefined || value === null || value === '') return undefined;
  if (!mongoose.isValidObjectId(value)) {
    throw new ApiError(400, `${fieldName} must be a valid id`);
  }
  return value;
}

function normalizeParentInfo(parent = {}, fieldName) {
  if (parent === undefined) return undefined;
  if (typeof parent !== 'object' || Array.isArray(parent)) {
    throw new ApiError(400, `${fieldName} must be an object`);
  }

  return {
    name: ensureString(parent.name, `${fieldName}.name`),
    education: ensureString(parent.education, `${fieldName}.education`),
    nationalId: ensureString(parent.nationalId, `${fieldName}.nationalId`),
    mobile: ensureString(parent.mobile, `${fieldName}.mobile`),
    occupation: ensureString(parent.occupation, `${fieldName}.occupation`),
    profession: ensureString(parent.profession, `${fieldName}.profession`),
    income: ensureNonNegativeNumber(parent.income, `${fieldName}.income`),
  };
}

export function validateStudentId(studentId) {
  if (!mongoose.isValidObjectId(studentId)) {
    throw new ApiError(400, 'Invalid student id');
  }
}

export function validateCreateStudentPayload(payload) {
  const studentName = ensureString(payload.studentName, 'studentName');
  const mobileNumber = ensureString(payload.mobileNumber, 'mobileNumber');
  const classId = ensureObjectId(payload.classId, 'classId');
  const admissionDate = ensureDate(payload.admissionDate, 'admissionDate');

  if (!studentName) throw new ApiError(400, 'studentName is required');
  if (!mobileNumber) throw new ApiError(400, 'mobileNumber is required');
  if (!classId) throw new ApiError(400, 'classId is required');
  if (!admissionDate) throw new ApiError(400, 'admissionDate is required');

  const normalized = normalizeStudentPayload(payload);
  normalized.studentName = studentName;
  normalized.mobileNumber = mobileNumber;
  normalized.classId = classId;
  normalized.admissionDate = admissionDate;

  return normalized;
}

export function validateUpdateStudentPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ApiError(400, 'Invalid update payload');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'registrationNo')) {
    throw new ApiError(400, 'registrationNo cannot be updated');
  }

  return normalizeStudentPayload(payload);
}

function normalizeStudentPayload(payload) {
  const normalized = {};

  const stringFields = [
    'studentName',
    'mobileNumber',
    'picture',
    'identificationMark',
    'bloodGroup',
    'disease',
    'birthFormId',
    'caste',
    'religion',
    'previousSchool',
    'previousSchoolId',
    'additionalNotes',
    'address',
  ];

  for (const field of stringFields) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      normalized[field] = ensureString(payload[field], field);
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'classId')) {
    normalized.classId = ensureObjectId(payload.classId, 'classId');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'familyId')) {
    normalized.familyId = ensureObjectId(payload.familyId, 'familyId');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'admissionDate')) {
    normalized.admissionDate = ensureDate(payload.admissionDate, 'admissionDate');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'dateOfBirth')) {
    normalized.dateOfBirth = ensureDate(payload.dateOfBirth, 'dateOfBirth');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'gender')) {
    const gender = ensureString(payload.gender, 'gender');
    if (gender && !GENDERS.has(gender)) {
      throw new ApiError(400, 'gender must be one of Male, Female, Other');
    }
    normalized.gender = gender;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'feeDiscountPercent')) {
    const feeDiscountPercent = Number(payload.feeDiscountPercent);
    if (Number.isNaN(feeDiscountPercent) || feeDiscountPercent < 0 || feeDiscountPercent > 100) {
      throw new ApiError(400, 'feeDiscountPercent must be between 0 and 100');
    }
    normalized.feeDiscountPercent = feeDiscountPercent;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'orphanStudent')) {
    normalized.orphanStudent = ensureBoolean(payload.orphanStudent, 'orphanStudent');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'oscStatus')) {
    normalized.oscStatus = ensureBoolean(payload.oscStatus, 'oscStatus');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'totalSiblings')) {
    normalized.totalSiblings = ensureNonNegativeNumber(payload.totalSiblings, 'totalSiblings');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'father')) {
    normalized.father = normalizeParentInfo(payload.father, 'father');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'mother')) {
    normalized.mother = normalizeParentInfo(payload.mother, 'mother');
  }

  return normalized;
}

export function validateStudentListQuery(query = {}) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);

  if (!Number.isInteger(page) || page < 1) {
    throw new ApiError(400, 'page must be a positive integer');
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ApiError(400, 'limit must be an integer between 1 and 100');
  }

  const allowedSortBy = new Set(['createdAt', 'studentName', 'registrationNo', 'admissionDate']);
  const allowedSortOrder = new Set(['asc', 'desc']);

  const sortBy = query.sortBy && allowedSortBy.has(query.sortBy) ? query.sortBy : 'createdAt';
  const sortOrder = query.sortOrder && allowedSortOrder.has(query.sortOrder) ? query.sortOrder : 'desc';

  const classId = ensureObjectId(query.classId, 'classId');
  const includeInactive = ensureBoolean(query.includeInactive, 'includeInactive') ?? false;
  const q = ensureString(query.q, 'q');

  return { page, limit, sortBy, sortOrder, classId, includeInactive, q };
}
