import mongoose from 'mongoose';
import { ApiError } from '../../utils/response.js';

const GENDERS = new Set(['Male', 'Female', 'Other']);
const BLOOD_GROUPS = new Set([
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
]);

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
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (typeof value !== 'string') {
    throw new ApiError(400, `${fieldName} must be a valid date`);
  }

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const separatorMatch = trimmed.match(/[./-]/);
  if (!separatorMatch) {
    throw new ApiError(400, `${fieldName} must be a valid date`);
  }

  const separator = separatorMatch[0];
  const parts = trimmed.split(separator).map((part) => part.trim());
  if (parts.length !== 3 || parts.some((part) => !/^\d{1,4}$/.test(part))) {
    throw new ApiError(400, `${fieldName} must be a valid date`);
  }

  let year;
  let month;
  let day;

  if (parts[0].length === 4) {
    year = Number(parts[0]);
    month = Number(parts[1]);
    day = Number(parts[2]);
  } else if (parts[2].length === 4 || parts[2].length <= 2) {
    day = Number(parts[0]);
    month = Number(parts[1]);
    year = normalizeYear(parts[2]);
  } else {
    throw new ApiError(400, `${fieldName} must be a valid date`);
  }

  if (parts[0].length === 4) {
    year = normalizeYear(parts[0]);
  }

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new ApiError(400, `${fieldName} must be a valid date`);
  }

  if (month < 1 || month > 12) {
    throw new ApiError(400, `${fieldName} must be a valid date`);
  }

  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > maxDay) {
    throw new ApiError(400, `${fieldName} must be a valid date`);
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function normalizeYear(value) {
  const year = Number(value);
  if (!Number.isInteger(year)) {
    throw new ApiError(400, 'year must be valid');
  }
  if (String(value).length <= 2) {
    return 2000 + year;
  }
  return year;
}

function getField(payload, ...keys) {
  for (const key of keys) {
    if (key === undefined) continue;
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      return payload[key];
    }
  }
  return undefined;
}

function ensureNonNegativeNumber(value, fieldName) {
  if (value === undefined || value === null || value === '') return undefined;
  const numeric = Number(value);
  if (Number.isNaN(numeric) || numeric < 0) {
    throw new ApiError(400, `${fieldName} must be a non-negative number`);
  }
  return numeric;
}

function ensureBloodGroup(value, fieldName) {
  const normalized = ensureString(value, fieldName);
  if (!normalized) return normalized;
  const uppercase = normalized.toUpperCase();
  if (!BLOOD_GROUPS.has(uppercase)) {
    throw new ApiError(400, `${fieldName} must be a valid blood group`);
  }
  return uppercase;
}

export function validateStudentId(studentId) {
  if (!mongoose.isValidObjectId(studentId)) {
    throw new ApiError(400, 'Invalid student id');
  }
}

export function validateCreateStudentPayload(payload) {
  const studentName = ensureString(getField(payload, 'studentName', 'Student Name'), 'studentName');
  const studentClass = ensureString(getField(payload, 'class', 'className', 'Class'), 'class');
  const scholarNumber = ensureString(
    getField(payload, 'scholarNumber', 'scholarNo', 'Scholar No', 'Scholar Number'),
    'scholarNumber'
  );
  const aadharCardNo = ensureString(getField(payload, 'aadharCardNo', 'aadhaarCardNo', 'Aadhar Card No'), 'aadharCardNo');
  const apaarId = ensureString(getField(payload, 'apaarId', 'APAAR ID'), 'apaarId');
  const pen = ensureString(getField(payload, 'pen', 'PEN'), 'pen');
  const fatherName = ensureString(getField(payload, 'fatherName', 'Father Name') ?? payload.father?.name, 'fatherName');
  const motherName = ensureString(getField(payload, 'motherName', 'Mother Name') ?? payload.mother?.name, 'motherName');
  const admNo = ensureString(getField(payload, 'admNo', 'admissionNo', 'registrationNo', 'Adm No'), 'admNo');
  const dateOfBirth = ensureDate(getField(payload, 'dateOfBirth', 'dob', 'DOB'), 'dateOfBirth');
  const gender = ensureString(getField(payload, 'gender', 'Gender'), 'gender');

  if (!studentName) throw new ApiError(400, 'studentName is required');
  if (!studentClass) throw new ApiError(400, 'class is required');
  if (!fatherName) throw new ApiError(400, 'fatherName is required');
  if (!motherName) throw new ApiError(400, 'motherName is required');
  if (!admNo) throw new ApiError(400, 'admNo is required');
  if (!dateOfBirth) throw new ApiError(400, 'dateOfBirth is required');
  if (!gender) throw new ApiError(400, 'gender is required');
  if (!GENDERS.has(gender)) {
    throw new ApiError(400, 'gender must be one of Male, Female, Other');
  }

  const normalized = normalizeStudentPayload(payload);
  normalized.studentName = studentName;
  normalized.class = studentClass;
  normalized.scholarNumber = scholarNumber;
  normalized.aadharCardNo = aadharCardNo;
  normalized.apaarId = apaarId;
  normalized.pen = pen;
  normalized.fatherName = fatherName;
  normalized.motherName = motherName;
  normalized.admNo = admNo;
  normalized.dateOfBirth = dateOfBirth;
  normalized.gender = gender;

  return normalized;
}

export function validateUpdateStudentPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ApiError(400, 'Invalid update payload');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'registrationNo')) {
    throw new ApiError(400, 'registrationNo cannot be updated directly; use admNo');
  }

  return normalizeStudentPayload(payload);
}

function normalizeStudentPayload(payload) {
  const normalized = {};

  const stringFields = [
    'studentName',
    'class',
    'scholarNumber',
    'aadharCardNo',
    'apaarId',
    'pen',
    'fatherName',
    'fatherOccupation',
    'motherName',
    'motherOccupation',
    'admNo',
    'caste',
    'category',
    'bankDetails',
    'address',
    'mobile',
    'profileImage',
  ];

  for (const field of stringFields) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      normalized[field] = ensureString(payload[field], field);
    }
  }

  if (!Object.prototype.hasOwnProperty.call(normalized, 'studentName')) {
    const studentName = getField(payload, 'Student Name');
    if (studentName !== undefined) {
      normalized.studentName = ensureString(studentName, 'studentName');
    }
  }

  if (
    !Object.prototype.hasOwnProperty.call(normalized, 'class') &&
    (Object.prototype.hasOwnProperty.call(payload, 'className') || Object.prototype.hasOwnProperty.call(payload, 'Class'))
  ) {
    normalized.class = ensureString(getField(payload, 'className', 'Class'), 'class');
  }

  if (!Object.prototype.hasOwnProperty.call(normalized, 'scholarNumber')) {
    const scholarNumber = getField(payload, 'scholarNo', 'Scholar No', 'Scholar Number');
    if (scholarNumber !== undefined) {
      normalized.scholarNumber = ensureString(scholarNumber, 'scholarNumber');
    }
  }

  if (!Object.prototype.hasOwnProperty.call(normalized, 'aadharCardNo')) {
    const aadharCardNo = getField(payload, 'aadhaarCardNo', 'Aadhar Card No');
    if (aadharCardNo !== undefined) {
      normalized.aadharCardNo = ensureString(aadharCardNo, 'aadharCardNo');
    }
  }

  if (!Object.prototype.hasOwnProperty.call(normalized, 'apaarId')) {
    const apaarId = getField(payload, 'APAAR ID');
    if (apaarId !== undefined) {
      normalized.apaarId = ensureString(apaarId, 'apaarId');
    }
  }

  if (!Object.prototype.hasOwnProperty.call(normalized, 'pen')) {
    const pen = getField(payload, 'PEN');
    if (pen !== undefined) {
      normalized.pen = ensureString(pen, 'pen');
    }
  }

  if (!Object.prototype.hasOwnProperty.call(normalized, 'fatherName')) {
    const fatherName = getField(payload, 'Father Name') ?? payload.father?.name;
    if (fatherName !== undefined) {
      normalized.fatherName = ensureString(fatherName, 'fatherName');
    }
  }

  if (!Object.prototype.hasOwnProperty.call(normalized, 'fatherOccupation')) {
    const fatherOccupation = getField(payload, 'Father Occupation', "Father's Occupation");
    if (fatherOccupation !== undefined) {
      normalized.fatherOccupation = ensureString(fatherOccupation, 'fatherOccupation');
    }
  }

  if (!Object.prototype.hasOwnProperty.call(normalized, 'motherName')) {
    const motherName = getField(payload, 'Mother Name') ?? payload.mother?.name;
    if (motherName !== undefined) {
      normalized.motherName = ensureString(motherName, 'motherName');
    }
  }

  if (!Object.prototype.hasOwnProperty.call(normalized, 'motherOccupation')) {
    const motherOccupation = getField(payload, 'Mother Occupation', "Mother's Occupation");
    if (motherOccupation !== undefined) {
      normalized.motherOccupation = ensureString(motherOccupation, 'motherOccupation');
    }
  }

  if (!Object.prototype.hasOwnProperty.call(normalized, 'admNo')) {
    const admNo = getField(payload, 'admissionNo', 'registrationNo', 'Adm No');
    if (admNo !== undefined) {
      normalized.admNo = ensureString(admNo, 'admNo');
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(payload, 'dateOfBirth') ||
    Object.prototype.hasOwnProperty.call(payload, 'dob') ||
    Object.prototype.hasOwnProperty.call(payload, 'DOB')
  ) {
    normalized.dateOfBirth = ensureDate(getField(payload, 'dateOfBirth', 'dob', 'DOB'), 'dateOfBirth');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'gender') || Object.prototype.hasOwnProperty.call(payload, 'Gender')) {
    const gender = ensureString(getField(payload, 'gender', 'Gender'), 'gender');
    if (gender && !GENDERS.has(gender)) {
      throw new ApiError(400, 'gender must be one of Male, Female, Other');
    }
    normalized.gender = gender;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'fatherIncome') || Object.prototype.hasOwnProperty.call(payload, "Father's Income")) {
    normalized.fatherIncome = ensureNonNegativeNumber(
      getField(payload, 'fatherIncome', "Father's Income"),
      'fatherIncome'
    );
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'motherIncome') || Object.prototype.hasOwnProperty.call(payload, "Mother's Income")) {
    normalized.motherIncome = ensureNonNegativeNumber(
      getField(payload, 'motherIncome', "Mother's Income"),
      'motherIncome'
    );
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'dateOfAdmission') || Object.prototype.hasOwnProperty.call(payload, 'admissionDate') || Object.prototype.hasOwnProperty.call(payload, 'Date of Admission')) {
    normalized.dateOfAdmission = ensureDate(
      getField(payload, 'dateOfAdmission', 'admissionDate', 'Date of Admission'),
      'dateOfAdmission'
    );
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'bloodGroup') || Object.prototype.hasOwnProperty.call(payload, 'Blood Group')) {
    normalized.bloodGroup = ensureBloodGroup(getField(payload, 'bloodGroup', 'Blood Group'), 'bloodGroup');
  }

  if (!Object.prototype.hasOwnProperty.call(normalized, 'category')) {
    const category = getField(payload, 'Category');
    if (category !== undefined) {
      normalized.category = ensureString(category, 'category');
    }
  }

  if (!Object.prototype.hasOwnProperty.call(normalized, 'caste')) {
    const caste = getField(payload, 'Caste');
    if (caste !== undefined) {
      normalized.caste = ensureString(caste, 'caste');
    }
  }

  if (!Object.prototype.hasOwnProperty.call(normalized, 'bankDetails')) {
    const bankDetails = getField(payload, 'Bank Details');
    if (bankDetails !== undefined) {
      normalized.bankDetails = ensureString(bankDetails, 'bankDetails');
    }
  }

  if (!Object.prototype.hasOwnProperty.call(normalized, 'address')) {
    const address = getField(payload, 'Address');
    if (address !== undefined) {
      normalized.address = ensureString(address, 'address');
    }
  }

  if (!Object.prototype.hasOwnProperty.call(normalized, 'mobile')) {
    const mobile = getField(payload, 'Mobile');
    if (mobile !== undefined) {
      normalized.mobile = ensureString(mobile, 'mobile');
    }
  }

  if (!Object.prototype.hasOwnProperty.call(normalized, 'profileImage')) {
    const profileImage = getField(payload, 'profileImage', 'profile_image', 'Profile_Image', 'picture');
    if (profileImage !== undefined) {
      normalized.profileImage = ensureString(profileImage, 'profileImage');
    }
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

  const allowedSortBy = new Set(['createdAt', 'studentName', 'class', 'admNo', 'dateOfBirth', 'dateOfAdmission']);
  const allowedSortOrder = new Set(['asc', 'desc']);

  const sortBy = query.sortBy && allowedSortBy.has(query.sortBy) ? query.sortBy : 'createdAt';
  const sortOrder = query.sortOrder && allowedSortOrder.has(query.sortOrder) ? query.sortOrder : 'desc';

  const studentClass = ensureString(getField(query, 'class', 'className'), 'class');
  const includeInactive = query.includeInactive === 'true' || query.includeInactive === true;
  const q = ensureString(query.q, 'q');

  return { page, limit, sortBy, sortOrder, class: studentClass, includeInactive, q };
}
