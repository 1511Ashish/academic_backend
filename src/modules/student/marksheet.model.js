import mongoose from 'mongoose';
import { applyBaseSchema } from '../../core/base.model.js';

const marksheetSubjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    marksObtained: { type: Number, min: 0 },
    maxMarks: { type: Number, min: 0 },
    grade: { type: String, trim: true },
    remarks: { type: String, trim: true },
    scores: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const marksheetOtherSubjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sem1: { type: String, trim: true },
    sem2: { type: String, trim: true },
  },
  { _id: false }
);

const marksheetCoScholasticSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    grade: { type: String, trim: true },
    semester: { type: String, trim: true },
  },
  { _id: false }
);

const marksheetSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true,
  },
  examName: { type: String, required: true, trim: true, default: 'Imported Marksheet' },
  academicYear: { type: String, trim: true, default: 'General' },
  term: { type: String, trim: true, default: 'General' },
  identifiers: {
    scholarNumber: { type: String, trim: true, index: true },
    admNo: { type: String, trim: true, index: true },
    studentName: { type: String, trim: true },
    className: { type: String, trim: true },
  },
  studentSnapshot: {
    studentName: { type: String, trim: true },
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    dateOfBirth: { type: Date },
    pen: { type: String, trim: true },
    apaarId: { type: String, trim: true },
    className: { type: String, trim: true },
    scholarNumber: { type: String, trim: true },
    admNo: { type: String, trim: true },
  },
  subjects: {
    type: [marksheetSubjectSchema],
    default: [],
  },
  scholastic: {
    type: [marksheetSubjectSchema],
    default: [],
  },
  otherSubjects: {
    type: [marksheetOtherSubjectSchema],
    default: [],
  },
  coScholastic: {
    type: [marksheetCoScholasticSchema],
    default: [],
  },
  totals: {
    obtainedMarks: { type: Number, min: 0, default: 0 },
    maxMarks: { type: Number, min: 0, default: 0 },
    percentage: { type: Number, min: 0 },
    result: { type: String, trim: true },
  },
  meta: {
    rollNo: { type: String, trim: true },
    classSection: { type: String, trim: true },
    schoolName: { type: String, trim: true },
    udise: { type: String, trim: true },
    session: { type: String, trim: true },
    rank: { type: String, trim: true },
    attendance: { type: String, trim: true },
    result: { type: String, trim: true },
    remarks: { type: String, trim: true },
  },
  rawRow: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
});

marksheetSchema.index(
  { tenantId: 1, studentId: 1, examName: 1, academicYear: 1, term: 1 },
  { unique: true }
);
marksheetSchema.index({ tenantId: 1, 'identifiers.scholarNumber': 1 });
marksheetSchema.index({ tenantId: 1, 'identifiers.admNo': 1 });

applyBaseSchema(marksheetSchema);

export const StudentMarksheet = mongoose.model('StudentMarksheet', marksheetSchema);
