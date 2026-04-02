import { ClassModel } from './class.model.js';
import { Teacher } from '../teacher/teacher.model.js';
import { Student } from '../student/student.model.js';
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

function normalizeClassName(value) {
  return typeof value === 'string' ? value.trim() : '';
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

function buildStudentFilter(tenantId, options = {}) {
  const filter = { tenantId };

  if (!options.includeInactive) {
    filter.isActive = true;
  }

  if (options.q) {
    filter.class = new RegExp(options.q, 'i');
  }

  return filter;
}

function toComparableValue(value) {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase();
  }

  return '';
}

function sortGroupedClasses(items, sortBy, sortOrder) {
  const direction = sortOrder === 'asc' ? 1 : -1;

  items.sort((left, right) => {
    const leftValue =
      sortBy === 'className'
        ? left.className
        : (left[sortBy] ?? left.className ?? left.createdAt ?? left.updatedAt ?? '');
    const rightValue =
      sortBy === 'className'
        ? right.className
        : (right[sortBy] ?? right.className ?? right.createdAt ?? right.updatedAt ?? '');

    const comparableLeft = toComparableValue(leftValue);
    const comparableRight = toComparableValue(rightValue);

    if (comparableLeft < comparableRight) return -1 * direction;
    if (comparableLeft > comparableRight) return 1 * direction;
    return 0;
  });
}

function buildClassBucket(classDoc, students) {
  const primaryStudent = students[0];

  return {
    _id: classDoc?._id ?? null,
    className: classDoc?.className ?? primaryStudent?.class ?? null,
    monthlyTuitionFee: classDoc?.monthlyTuitionFee,
    classTeacher: classDoc?.classTeacher ?? null,
    classCode: classDoc?.classCode,
    description: classDoc?.description,
    academicYear: classDoc?.academicYear,
    maxStudents: classDoc?.maxStudents,
    isActive: classDoc?.isActive ?? true,
    studentCount: students.length,
    students,
    createdAt: classDoc?.createdAt ?? primaryStudent?.createdAt,
    updatedAt: classDoc?.updatedAt ?? primaryStudent?.updatedAt,
  };
}

async function getGroupedClassesFromStudents(tenantId, options = {}) {
  const classFilter = buildClassFilter(tenantId, options);
  const studentFilter = buildStudentFilter(tenantId, options);

  const [classDocs, students] = await Promise.all([
    teacherPopulate(ClassModel.find(classFilter)).lean(),
    Student.find(studentFilter).sort({ class: 1, studentName: 1 }).lean(),
  ]);

  const classDocByName = new Map();
  for (const classDoc of classDocs) {
    classDocByName.set(normalizeClassName(classDoc.className), classDoc);
  }

  const groupedStudents = new Map();
  for (const student of students) {
    const className = normalizeClassName(student.class);
    if (!className) continue;

    const classDoc = classDocByName.get(className);
    if ((options.classTeacher || options.academicYear) && !classDoc) {
      continue;
    }

    if (!groupedStudents.has(className)) {
      groupedStudents.set(className, []);
    }

    groupedStudents.get(className).push(student);
  }

  const items = Array.from(groupedStudents.entries()).map(([className, classStudents]) =>
    buildClassBucket(classDocByName.get(className), classStudents)
  );

  sortGroupedClasses(items, options.sortBy, options.sortOrder);

  return {
    items,
    totalClasses: items.length,
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
  return getGroupedClassesFromStudents(tenantId, options);
}

export async function getClassById(id, tenantId) {
  validateClassId(id);

  const cls = await teacherPopulate(ClassModel.findOne({ _id: id, tenantId, isActive: true }));
  if (!cls) {
    throw new ApiError(404, 'Class not found');
  }

  const students = await Student.find({
    tenantId,
    class: cls.className,
    isActive: true,
  }).sort({ studentName: 1 });

  return buildClassBucket(cls.toObject(), students.map((student) => student.toObject()));
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
