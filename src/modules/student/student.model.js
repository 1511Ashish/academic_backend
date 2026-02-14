import mongoose from 'mongoose';
import { applyBaseSchema } from '../../core/base.model.js';

const parentInfoSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    education: { type: String, trim: true },
    nationalId: { type: String, trim: true },
    mobile: { type: String, trim: true },
    occupation: { type: String, trim: true },
    profession: { type: String, trim: true },
    income: { type: Number, min: 0 },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema({
  studentName: { type: String, required: true, trim: true, index: true },
  registrationNo: { type: String, required: true, unique: true, index: true, immutable: true },
  admissionDate: { type: Date, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  feeDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
  mobileNumber: { type: String, required: true, trim: true },
  picture: { type: String, trim: true },

  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  identificationMark: { type: String, trim: true },
  bloodGroup: { type: String, trim: true },
  disease: { type: String, trim: true },
  birthFormId: { type: String, trim: true },
  caste: { type: String, trim: true },
  religion: { type: String, trim: true },
  previousSchool: { type: String, trim: true },
  previousSchoolId: { type: String, trim: true },
  additionalNotes: { type: String, trim: true },
  orphanStudent: { type: Boolean, default: false },
  oscStatus: { type: Boolean, default: false },
  totalSiblings: { type: Number, min: 0 },
  address: { type: String, trim: true },

  father: { type: parentInfoSchema, default: () => ({}) },
  mother: { type: parentInfoSchema, default: () => ({}) },
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family' },

  isActive: { type: Boolean, default: true, index: true },
});

studentSchema.index({ tenantId: 1, classId: 1, isActive: 1 });
studentSchema.index({ tenantId: 1, registrationNo: 1 });
studentSchema.index({ tenantId: 1, studentName: 1 });
studentSchema.index({ tenantId: 1, mobileNumber: 1 });

const counterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: false, versionKey: false }
);

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

studentSchema.statics.generateRegistrationNo = async function generateRegistrationNo() {
  const year = new Date().getUTCFullYear();
  const key = `student-registration-${year}`;

  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return `SCH-${year}-${String(counter.seq).padStart(4, '0')}`;
};

studentSchema.pre('validate', async function assignRegistrationNo(next) {
  try {
    if (!this.registrationNo) {
      this.registrationNo = await this.constructor.generateRegistrationNo();
    }
    next();
  } catch (error) {
    next(error);
  }
});

applyBaseSchema(studentSchema);

export const Student = mongoose.model('Student', studentSchema);
