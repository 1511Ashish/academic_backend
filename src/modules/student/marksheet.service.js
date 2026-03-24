import XLSX from 'xlsx';
import { Student } from './student.model.js';
import { StudentMarksheet } from './marksheet.model.js';
import { ApiError } from '../../utils/response.js';

const RESERVED_HEADERS = new Set([
  'scholarnumber',
  'scholarno',
  'scholar',
  'admno',
  'admissionno',
  'admissionnumber',
  'registrationno',
  'name',
  'studentname',
  'student',
  'class',
  'classname',
  'section',
  'exam',
  'examname',
  'academicyear',
  'session',
  'term',
  'fathername',
  'mothername',
  'pen',
  'pan',
  'apaar',
  'apaarid',
  'dob',
  'dateofbirth',
  'result',
  'percentage',
  'total',
  'totalmarks',
  'obtainedmarks',
  'maxmarks',
]);

const MULTI_SHEET_CONFIG = {
  students: 'Students',
  scholastic: 'Scholastic',
  otherSubjects: 'OtherSubjects',
  coScholastic: 'CoScholastic',
};

const OBTAINED_SUFFIXES = ['marksobtained', 'obtainedmarks', 'obtained', 'marks', 'score'];
const MAX_SUFFIXES = ['maxmarks', 'maximummarks', 'maximum', 'max', 'outof', 'fullmarks', 'totalmarks'];
const GRADE_SUFFIXES = ['grade'];
const REMARK_SUFFIXES = ['remark', 'remarks'];

function normalizeHeader(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function headerKey(value) {
  return normalizeHeader(value).replace(/\s+/g, '');
}

function cleanString(value) {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim();
  return normalized === '' ? undefined : normalized;
}

function normalizeIdentifier(value) {
  const normalized = cleanString(value);
  return normalized ? normalized.toLowerCase().replace(/\s+/g, ' ').trim() : undefined;
}

function normalizeName(value) {
  return normalizeIdentifier(value);
}

function numberOrUndefined(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function getRowValue(row, aliases) {
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(row, alias)) {
      return row[alias];
    }
  }
  return undefined;
}

function getStudentIdentity(row) {
  return {
    scholarNumber: cleanString(
      getRowValue(row, ['Scholar No', 'Scholar Number', 'scholarNo', 'scholarNumber', 'scholar no', 'scholar number'])
    ),
    admNo: cleanString(
      getRowValue(row, [
        'Adm No',
        'Admission No',
        'Admission Number',
        'admissionNo',
        'admNo',
        'registrationNo',
        'admission number',
      ])
    ),
    studentName: cleanString(getRowValue(row, ['Student Name', 'Name', 'studentName', 'name', 'student'])),
    className: cleanString(getRowValue(row, ['Class', 'className', 'class', 'Class Section', 'classSection'])),
    examName: cleanString(getRowValue(row, ['Exam', 'Exam Name', 'examName', 'exam'])),
    academicYear: cleanString(getRowValue(row, ['Academic Year', 'Session', 'academicYear', 'session'])),
    term: cleanString(getRowValue(row, ['Term', 'term'])),
    result: cleanString(getRowValue(row, ['Result', 'result'])),
    percentage: numberOrUndefined(getRowValue(row, ['Percentage', 'percentage'])),
    obtainedMarks: numberOrUndefined(getRowValue(row, ['Obtained Marks', 'Total Obtained', 'obtainedMarks'])),
    maxMarks: numberOrUndefined(getRowValue(row, ['Max Marks', 'Total Max', 'maxMarks', 'Total Marks', 'totalMarks'])),
  };
}

function getStudentIdentityFromSheetRow(row) {
  return {
    studentId: cleanString(getRowValue(row, ['studentId', 'studentID'])),
    scholarNumber: cleanString(
      getRowValue(row, ['scholarNo', 'scholarNumber', 'Scholar No', 'Scholar Number', 'scholar number'])
    ),
    admNo: cleanString(getRowValue(row, ['admNo', 'admissionNo', 'Adm No', 'Admission No', 'Admission Number'])),
    studentName: cleanString(getRowValue(row, ['name', 'studentName', 'Student Name', 'student'])),
    className: cleanString(
      getRowValue(row, ['classSection', 'Class Section', 'class', 'className', 'Class'])
    ),
    dob: cleanString(getRowValue(row, ['dob', 'dateOfBirth', 'DOB'])),
    father: cleanString(getRowValue(row, ['father', 'fatherName'])),
    mother: cleanString(getRowValue(row, ['mother', 'motherName'])),
    schoolName: cleanString(getRowValue(row, ['schoolName'])),
    udise: cleanString(getRowValue(row, ['udise'])),
    session: cleanString(getRowValue(row, ['session', 'academicYear'])),
    rank: cleanString(getRowValue(row, ['rank'])),
    attendance: cleanString(getRowValue(row, ['attendance'])),
    result: cleanString(getRowValue(row, ['result'])),
    remarks: cleanString(getRowValue(row, ['remarks'])),
    rollNo: cleanString(getRowValue(row, ['rollNo', 'roll'])),
  };
}

function extractSubjectMetric(header) {
  const normalized = normalizeHeader(header);
  const key = normalized.replace(/\s+/g, '');

  if (!normalized || RESERVED_HEADERS.has(key)) {
    return null;
  }

  for (const suffix of MAX_SUFFIXES) {
    if (key.endsWith(suffix)) {
      return { subject: normalized.slice(0, normalized.length - suffix.length).trim(), metric: 'maxMarks' };
    }
  }

  for (const suffix of GRADE_SUFFIXES) {
    if (key.endsWith(suffix)) {
      return { subject: normalized.slice(0, normalized.length - suffix.length).trim(), metric: 'grade' };
    }
  }

  for (const suffix of REMARK_SUFFIXES) {
    if (key.endsWith(suffix)) {
      return { subject: normalized.slice(0, normalized.length - suffix.length).trim(), metric: 'remarks' };
    }
  }

  for (const suffix of OBTAINED_SUFFIXES) {
    if (key.endsWith(suffix)) {
      return { subject: normalized.slice(0, normalized.length - suffix.length).trim(), metric: 'marksObtained' };
    }
  }

  return { subject: normalized, metric: 'marksObtained' };
}

function titleCase(value) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildSubjects(row) {
  const subjects = new Map();

  for (const [header, rawValue] of Object.entries(row)) {
    const value = rawValue === '' ? undefined : rawValue;
    if (value === undefined || value === null) {
      continue;
    }

    const metricInfo = extractSubjectMetric(header);
    if (!metricInfo || !metricInfo.subject) {
      continue;
    }

    const subjectKey = headerKey(metricInfo.subject);
    if (!subjectKey || RESERVED_HEADERS.has(subjectKey)) {
      continue;
    }

    if (!subjects.has(subjectKey)) {
      subjects.set(subjectKey, {
        name: titleCase(metricInfo.subject),
      });
    }

    const subject = subjects.get(subjectKey);

    if (metricInfo.metric === 'marksObtained' || metricInfo.metric === 'maxMarks') {
      subject[metricInfo.metric] = numberOrUndefined(value);
      continue;
    }

    subject[metricInfo.metric] = cleanString(value);
  }

  return Array.from(subjects.values()).filter((subject) => {
    return (
      subject.name &&
      (subject.marksObtained !== undefined ||
        subject.maxMarks !== undefined ||
        subject.grade !== undefined ||
        subject.remarks !== undefined)
    );
  });
}

function buildStudentMaps(students) {
  const byScholar = new Map();
  const byAdmNo = new Map();
  const byNameClass = new Map();
  const byName = new Map();

  for (const student of students) {
    const scholarNumber = normalizeIdentifier(student.scholarNumber);
    const admNo = normalizeIdentifier(student.admNo);
    const nameKey = normalizeName(student.studentName);
    const nameClassKey = `${normalizeName(student.studentName)}::${normalizeName(student.class)}`;

    if (scholarNumber) {
      byScholar.set(scholarNumber, student);
    }

    if (admNo) {
      byAdmNo.set(admNo, student);
    }

    if (nameKey) {
      if (!byName.has(nameKey)) {
        byName.set(nameKey, []);
      }
      byName.get(nameKey).push(student);
    }

    if (!byNameClass.has(nameClassKey)) {
      byNameClass.set(nameClassKey, []);
    }
    byNameClass.get(nameClassKey).push(student);
  }

  return { byScholar, byAdmNo, byNameClass, byName };
}

function matchStudent(identity, maps) {
  const matches = [];

  const scholarNumber = normalizeIdentifier(identity.scholarNumber);
  const admNo = normalizeIdentifier(identity.admNo);

  if (scholarNumber) {
    const student = maps.byScholar.get(scholarNumber);
    if (student) {
      matches.push({ type: 'scholarNumber', student });
    }

    const admStudent = maps.byAdmNo.get(scholarNumber);
    if (admStudent) {
      matches.push({ type: 'scholarNumber->admNo', student: admStudent });
    }
  }

  if (admNo) {
    const student = maps.byAdmNo.get(admNo);
    if (student) {
      matches.push({ type: 'admNo', student });
    }

    const scholarStudent = maps.byScholar.get(admNo);
    if (scholarStudent) {
      matches.push({ type: 'admNo->scholarNumber', student: scholarStudent });
    }
  }

  if (identity.studentName && identity.className) {
    const key = `${normalizeName(identity.studentName)}::${normalizeName(identity.className)}`;
    const students = maps.byNameClass.get(key) ?? [];
    for (const student of students) {
      matches.push({ type: 'name+class', student });
    }
  } else if (identity.studentName) {
    const students = maps.byName.get(normalizeName(identity.studentName)) ?? [];
    if (students.length === 1) {
      matches.push({ type: 'name', student: students[0] });
    }
  }

  const uniqueStudentIds = new Map(matches.map((entry) => [String(entry.student._id), entry]));
  const uniqueMatches = Array.from(uniqueStudentIds.values());

  if (uniqueMatches.length === 0) {
    return { student: null, matchType: null, error: 'Student not found' };
  }

  if (uniqueMatches.length > 1) {
    return { student: null, matchType: null, error: 'Multiple students matched the same row' };
  }

  return {
    student: uniqueMatches[0].student,
    matchType: uniqueMatches[0].type,
    error: null,
  };
}

function buildStudentSnapshot(student) {
  return {
    studentName: student.studentName,
    fatherName: student.fatherName,
    motherName: student.motherName,
    dateOfBirth: student.dateOfBirth,
    pen: student.pen,
    apaarId: student.apaarId,
    className: student.class,
    scholarNumber: student.scholarNumber,
    admNo: student.admNo,
  };
}

function buildMarksheetResponse(doc) {
  return {
    id: doc._id,
    examName: doc.examName,
    academicYear: doc.academicYear,
    term: doc.term,
    student: {
      name: doc.studentSnapshot.studentName,
      fatherName: doc.studentSnapshot.fatherName,
      motherName: doc.studentSnapshot.motherName,
      dob: doc.studentSnapshot.dateOfBirth,
      pen: doc.studentSnapshot.pen,
      apaarId: doc.studentSnapshot.apaarId,
      class: doc.studentSnapshot.className,
      scholarNumber: doc.studentSnapshot.scholarNumber,
      admNo: doc.studentSnapshot.admNo,
    },
    subjects: doc.subjects.map((subject) => ({
      subject: subject.name,
      marksObtained: subject.marksObtained,
      maxMarks: subject.maxMarks,
      grade: subject.grade,
      remarks: subject.remarks,
      scores: subject.scores,
    })),
    scholastic: doc.scholastic.map((subject) => ({
      subject: subject.name,
      scores: subject.scores,
      grade: subject.grade,
      remarks: subject.remarks,
    })),
    otherSubjects: doc.otherSubjects.map((subject) => ({
      name: subject.name,
      sem1: subject.sem1,
      sem2: subject.sem2,
    })),
    coScholastic: doc.coScholastic.map((subject) => ({
      name: subject.name,
      grade: subject.grade,
      semester: subject.semester,
    })),
    totals: doc.totals,
    meta: doc.meta,
    updatedAt: doc.updatedAt,
  };
}

function buildMarksheetKey({ studentId, examName, academicYear, term }) {
  return `${String(studentId)}::${examName}::${academicYear}::${term}`;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildCaseInsensitiveExactClauses(field, values) {
  return [...new Set(values.map((value) => cleanString(value)).filter(Boolean))].map((value) => ({
    [field]: new RegExp(`^\\s*${escapeRegExp(value)}\\s*$`, 'i'),
  }));
}

function buildStudentLookupFilter({ tenantId, identities, emptyMessage }) {
  const scholarNumbers = identities.map((item) => item.identity.scholarNumber);
  const admissionNumbers = identities.map((item) => item.identity.admNo);
  const studentNames = identities.map((item) => item.identity.studentName);
  const studentPairs = identities
    .map((item) => ({
      studentName: cleanString(item.identity.studentName),
      className: cleanString(item.identity.className),
    }))
    .filter((item) => item.studentName && item.className);

  const orClauses = [
    ...buildCaseInsensitiveExactClauses('scholarNumber', scholarNumbers),
    ...buildCaseInsensitiveExactClauses('admNo', scholarNumbers),
    ...buildCaseInsensitiveExactClauses('admNo', admissionNumbers),
    ...buildCaseInsensitiveExactClauses('scholarNumber', admissionNumbers),
    ...buildCaseInsensitiveExactClauses('studentName', studentNames),
    ...studentPairs.map((item) => ({
      studentName: new RegExp(`^\\s*${escapeRegExp(item.studentName)}\\s*$`, 'i'),
      class: new RegExp(`^\\s*${escapeRegExp(item.className)}\\s*$`, 'i'),
    })),
  ];

  if (orClauses.length === 0) {
    throw new ApiError(400, emptyMessage);
  }

  return {
    tenantId,
    isActive: true,
    $or: orClauses,
  };
}

function computeTotals(subjects, identity) {
  const obtainedFromSubjects = subjects.reduce((sum, subject) => sum + (subject.marksObtained ?? 0), 0);
  const maxFromSubjects = subjects.reduce((sum, subject) => sum + (subject.maxMarks ?? 0), 0);
  const obtainedMarks = identity.obtainedMarks ?? obtainedFromSubjects;
  const maxMarks = identity.maxMarks ?? maxFromSubjects;
  const percentage =
    identity.percentage ?? (maxMarks > 0 ? Number(((obtainedMarks / maxMarks) * 100).toFixed(2)) : undefined);

  return {
    obtainedMarks,
    maxMarks,
    percentage,
    result: identity.result,
  };
}

function loadWorkbook(buffer, filename) {
  const lowerFileName = String(filename ?? '').toLowerCase();
  const type = lowerFileName.endsWith('.csv') ? 'string' : 'buffer';
  const input = type === 'string' ? buffer.toString('utf8') : buffer;
  return XLSX.read(input, { type, cellDates: true });
}

function sheetToJson(sheet) {
  return XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    raw: false,
    dateNF: 'yyyy-mm-dd',
  });
}

function parseMultiSheet(workbook) {
  const studentSheet = workbook.Sheets[MULTI_SHEET_CONFIG.students];
  if (!studentSheet) {
    return null;
  }

  const scholasticSheet = workbook.Sheets[MULTI_SHEET_CONFIG.scholastic];
  const otherSubjectsSheet = workbook.Sheets[MULTI_SHEET_CONFIG.otherSubjects];
  const coScholasticSheet = workbook.Sheets[MULTI_SHEET_CONFIG.coScholastic];

  return {
    students: sheetToJson(studentSheet),
    scholastic: scholasticSheet ? sheetToJson(scholasticSheet) : [],
    otherSubjects: otherSubjectsSheet ? sheetToJson(otherSubjectsSheet) : [],
    coScholastic: coScholasticSheet ? sheetToJson(coScholasticSheet) : [],
  };
}

function buildScholasticMap(rows) {
  const map = new Map();

  for (const row of rows) {
    const studentId = cleanString(row.studentId);
    const subjectName = cleanString(row.subject || row.name);
    if (!studentId || !subjectName) {
      continue;
    }

    if (!map.has(studentId)) {
      map.set(studentId, []);
    }

    map.get(studentId).push({
      name: subjectName,
      scores: {
        t1: numberOrUndefined(row.t1),
        t2: numberOrUndefined(row.t2),
        or1: numberOrUndefined(row.or1),
        pw1: numberOrUndefined(row.pw1),
        hy: numberOrUndefined(row.hy),
        t3: numberOrUndefined(row.t3),
        t4: numberOrUndefined(row.t4),
        or2: numberOrUndefined(row.or2),
        pw2: numberOrUndefined(row.pw2),
        an: numberOrUndefined(row.an),
      },
    });
  }

  return map;
}

function buildOtherSubjectsMap(rows) {
  const map = new Map();

  for (const row of rows) {
    const studentId = cleanString(row.studentId);
    const name = cleanString(row.name);
    if (!studentId || !name) {
      continue;
    }
    if (!map.has(studentId)) {
      map.set(studentId, []);
    }
    map.get(studentId).push({
      name,
      sem1: cleanString(row.sem1),
      sem2: cleanString(row.sem2),
    });
  }

  return map;
}

function buildCoScholasticMap(rows) {
  const map = new Map();

  for (const row of rows) {
    const studentId = cleanString(row.studentId);
    const name = cleanString(row.name);
    if (!studentId || !name) {
      continue;
    }
    if (!map.has(studentId)) {
      map.set(studentId, []);
    }
    map.get(studentId).push({
      name,
      grade: cleanString(row.grade),
      semester: cleanString(row.semester),
    });
  }

  return map;
}

async function importMultiSheet({ workbook, body, tenantId }) {
  const parsed = parseMultiSheet(workbook);
  if (!parsed) {
    return null;
  }

  const studentsSheet = parsed.students;
  if (!studentsSheet.length) {
    throw new ApiError(400, 'Students sheet is empty');
  }

  const identities = studentsSheet.map((row, index) => ({
    rowNumber: index + 2,
    identity: getStudentIdentityFromSheetRow(row),
    row,
  }));

  const lookupFilter = buildStudentLookupFilter({
    tenantId,
    identities,
    emptyMessage: 'Students sheet must contain scholar number, admission number, or student name with class',
  });

  const students = await Student.find(lookupFilter).select(
    '_id studentName fatherName motherName dateOfBirth pen apaarId class scholarNumber admNo'
  );
  const maps = buildStudentMaps(students);
  const scholasticMap = buildScholasticMap(parsed.scholastic);
  const otherSubjectsMap = buildOtherSubjectsMap(parsed.otherSubjects);
  const coScholasticMap = buildCoScholasticMap(parsed.coScholastic);

  const seenIdentityKeys = new Set();
  const operations = [];
  const failures = [];

  for (const entry of identities) {
    const { identity, row, rowNumber } = entry;
    const duplicateKey = cleanString(identity.scholarNumber || identity.admNo || `${identity.studentName}::${identity.className}`);

    if (!duplicateKey) {
      failures.push({
        rowNumber,
        reason: 'Missing scholar number, admission number, and student name/class',
      });
      continue;
    }

    const fileKey = duplicateKey.toLowerCase();
    if (seenIdentityKeys.has(fileKey)) {
      failures.push({
        rowNumber,
        reason: 'Duplicate scholar/admission/student row in uploaded file',
      });
      continue;
    }
    seenIdentityKeys.add(fileKey);

    const match = matchStudent(identity, maps);
    if (!match.student) {
      failures.push({
        rowNumber,
        reason: match.error,
        scholarNumber: identity.scholarNumber,
        admNo: identity.admNo,
        studentName: identity.studentName,
        class: identity.className,
      });
      continue;
    }

    const studentSnapshot = buildStudentSnapshot(match.student);
    const academicYear = cleanString(body.academicYear) || identity.session || 'General';
    const examName = cleanString(body.examName) || 'Annual Marksheet';
    const term = cleanString(body.term) || 'Full Year';
    const studentSheetId = identity.studentId;
    const scholastic = studentSheetId ? scholasticMap.get(studentSheetId) ?? [] : [];
    const otherSubjects = studentSheetId ? otherSubjectsMap.get(studentSheetId) ?? [] : [];
    const coScholastic = studentSheetId ? coScholasticMap.get(studentSheetId) ?? [] : [];

    operations.push({
      updateOne: {
        filter: {
          tenantId,
          studentId: match.student._id,
          examName,
          academicYear,
          term,
        },
        update: {
          $set: {
            tenantId,
            studentId: match.student._id,
            examName,
            academicYear,
            term,
            identifiers: {
              scholarNumber: identity.scholarNumber || match.student.scholarNumber,
              admNo: identity.admNo || match.student.admNo,
              studentName: identity.studentName || match.student.studentName,
              className: identity.className || match.student.class,
            },
            studentSnapshot,
            scholastic,
            otherSubjects,
            coScholastic,
            meta: {
              rollNo: identity.rollNo,
              classSection: identity.className,
              schoolName: identity.schoolName,
              udise: identity.udise,
              session: identity.session,
              rank: identity.rank,
              attendance: identity.attendance,
              result: identity.result,
              remarks: identity.remarks,
            },
            rawRow: row,
          },
        },
        upsert: true,
      },
      rowNumber,
      matchedBy: match.matchType,
      studentId: match.student._id,
      examName,
      academicYear,
      term,
    });
  }

  const existingDocs = operations.length
    ? await StudentMarksheet.find({
        tenantId,
        $or: operations.map((entry) => ({
          studentId: entry.studentId,
          examName: entry.examName,
          academicYear: entry.academicYear,
          term: entry.term,
        })),
      }).select('_id studentId examName academicYear term')
    : [];
  const existingKeys = new Set(existingDocs.map((doc) => buildMarksheetKey(doc)));

  if (operations.length > 0) {
    await StudentMarksheet.bulkWrite(
      operations.map((entry) => ({
        updateOne: entry.updateOne,
      })),
      { ordered: false }
    );
  }

  const importedKeys = operations.map((entry) => ({
    tenantId,
    studentId: entry.studentId,
    examName: entry.examName,
    academicYear: entry.academicYear,
    term: entry.term,
  }));

  const importedDocs = importedKeys.length
    ? await StudentMarksheet.find({ $or: importedKeys }).sort({ updatedAt: -1 })
    : [];
  const statuses = new Map(
    operations.map((entry) => [
      buildMarksheetKey(entry),
      existingKeys.has(buildMarksheetKey(entry)) ? 'updated' : 'created',
    ])
  );

  return {
    summary: {
      totalRows: studentsSheet.length,
      importedCount: importedDocs.length,
      createdCount: Array.from(statuses.values()).filter((status) => status === 'created').length,
      updatedCount: Array.from(statuses.values()).filter((status) => status === 'updated').length,
      failedCount: failures.length,
    },
    failures,
    items: importedDocs.map((doc) => ({
      ...buildMarksheetResponse(doc),
      status: statuses.get(buildMarksheetKey(doc)) ?? 'created',
    })),
  };
}

export async function importStudentMarksheets({ file, body, tenantId }) {
  if (!tenantId) {
    throw new ApiError(400, 'Missing tenant context');
  }

  if (!file?.buffer) {
    throw new ApiError(400, 'Excel file is required');
  }

  const workbook = loadWorkbook(file.buffer, file.originalname);
  if (!workbook.SheetNames.length) {
    throw new ApiError(400, 'Excel file does not contain any sheet');
  }

  const multiSheetResult = await importMultiSheet({ workbook, body, tenantId });
  if (multiSheetResult) {
    return multiSheetResult;
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = sheetToJson(sheet);

  if (rows.length === 0) {
    throw new ApiError(400, 'Excel file does not contain any data rows');
  }

  const identities = rows.map((row, index) => {
    const identity = getStudentIdentity(row);
    return {
      rowNumber: index + 2,
      identity,
      row,
    };
  });

  const lookupFilter = buildStudentLookupFilter({
    tenantId,
    identities,
    emptyMessage: 'Each row must contain scholar number, admission number, or student name with class',
  });

  const students = await Student.find(lookupFilter).select(
    '_id studentName fatherName motherName dateOfBirth pen apaarId class scholarNumber admNo'
  );

  const maps = buildStudentMaps(students);
  const seenIdentityKeys = new Set();
  const operations = [];
  const failures = [];

  for (const entry of identities) {
    const { identity, row, rowNumber } = entry;
    const duplicateKey = cleanString(identity.scholarNumber || identity.admNo || `${identity.studentName}::${identity.className}`);

    if (!duplicateKey) {
      failures.push({
        rowNumber,
        reason: 'Missing scholar number, admission number, and student name/class',
      });
      continue;
    }

    const fileKey = duplicateKey.toLowerCase();
    if (seenIdentityKeys.has(fileKey)) {
      failures.push({
        rowNumber,
        reason: 'Duplicate scholar/admission/student row in uploaded file',
      });
      continue;
    }
    seenIdentityKeys.add(fileKey);

    const match = matchStudent(identity, maps);
    if (!match.student) {
      failures.push({
        rowNumber,
        reason: match.error,
        scholarNumber: identity.scholarNumber,
        admNo: identity.admNo,
        studentName: identity.studentName,
        class: identity.className,
      });
      continue;
    }

    const subjects = buildSubjects(row);
    const totals = computeTotals(subjects, identity);
    const studentSnapshot = buildStudentSnapshot(match.student);
    const examName = cleanString(body.examName) || identity.examName || 'Imported Marksheet';
    const academicYear = cleanString(body.academicYear) || identity.academicYear || 'General';
    const term = cleanString(body.term) || identity.term || 'General';

    operations.push({
      updateOne: {
        filter: {
          tenantId,
          studentId: match.student._id,
          examName,
          academicYear,
          term,
        },
        update: {
          $set: {
            tenantId,
            studentId: match.student._id,
            examName,
            academicYear,
            term,
            identifiers: {
              scholarNumber: identity.scholarNumber || match.student.scholarNumber,
              admNo: identity.admNo || match.student.admNo,
              studentName: identity.studentName || match.student.studentName,
              className: identity.className || match.student.class,
            },
            studentSnapshot,
            subjects,
            totals,
            rawRow: row,
          },
        },
        upsert: true,
      },
      rowNumber,
      matchedBy: match.matchType,
      studentId: match.student._id,
      examName,
      academicYear,
      term,
    });
  }

  const existingDocs = operations.length
    ? await StudentMarksheet.find({
        tenantId,
        $or: operations.map((entry) => ({
          studentId: entry.studentId,
          examName: entry.examName,
          academicYear: entry.academicYear,
          term: entry.term,
        })),
      }).select('_id studentId examName academicYear term')
    : [];
  const existingKeys = new Set(existingDocs.map((doc) => buildMarksheetKey(doc)));

  if (operations.length > 0) {
    await StudentMarksheet.bulkWrite(
      operations.map((entry) => ({
        updateOne: entry.updateOne,
      })),
      { ordered: false }
    );
  }

  const importedKeys = operations.map((entry) => ({
    tenantId,
    studentId: entry.studentId,
    examName: entry.examName,
    academicYear: entry.academicYear,
    term: entry.term,
  }));

  const importedDocs = importedKeys.length
    ? await StudentMarksheet.find({ $or: importedKeys }).sort({ updatedAt: -1 })
    : [];
  const statuses = new Map(
    operations.map((entry) => [
      buildMarksheetKey(entry),
      existingKeys.has(buildMarksheetKey(entry)) ? 'updated' : 'created',
    ])
  );

  return {
    summary: {
      totalRows: rows.length,
      importedCount: importedDocs.length,
      createdCount: Array.from(statuses.values()).filter((status) => status === 'created').length,
      updatedCount: Array.from(statuses.values()).filter((status) => status === 'updated').length,
      failedCount: failures.length,
    },
    failures,
    items: importedDocs.map((doc) => ({
      ...buildMarksheetResponse(doc),
      status: statuses.get(buildMarksheetKey(doc)) ?? 'created',
    })),
  };
}

export async function getStudentMarksheets(tenantId, query = {}) {
  if (!tenantId) {
    throw new ApiError(400, 'Missing tenant context');
  }

  const filter = { tenantId };
  const scholarNumber = cleanString(query.scholarNumber);
  const admNo = cleanString(query.admNo);
  const studentId = cleanString(query.studentId);
  const examName = cleanString(query.examName);
  const academicYear = cleanString(query.academicYear);
  const term = cleanString(query.term);

  if (studentId) {
    filter.studentId = studentId;
  }

  if (scholarNumber) {
    filter['identifiers.scholarNumber'] = scholarNumber;
  }

  if (admNo) {
    filter['identifiers.admNo'] = admNo;
  }

  if (examName) {
    filter.examName = examName;
  }

  if (academicYear) {
    filter.academicYear = academicYear;
  }

  if (term) {
    filter.term = term;
  }

  const docs = await StudentMarksheet.find(filter).sort({ updatedAt: -1 });
  return docs.map(buildMarksheetResponse);
}
