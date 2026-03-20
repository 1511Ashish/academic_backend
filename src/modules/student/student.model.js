import mongoose from 'mongoose';
import { applyBaseSchema } from '../../core/base.model.js';

const studentSchema = new mongoose.Schema({
  studentName: { type: String, required: true, trim: true, index: true },
  class: { type: String, required: true, trim: true, index: true },
  aadharCardNo: { type: String, trim: true, index: true },
  apaarId: { type: String, trim: true, index: true },
  pen: { type: String, trim: true, index: true },
  fatherName: { type: String, required: true, trim: true },
  fatherOccupation: { type: String, trim: true },
  fatherIncome: { type: Number, min: 0 },
  motherName: { type: String, required: true, trim: true },
  motherOccupation: { type: String, trim: true },
  motherIncome: { type: Number, min: 0 },
  admNo: { type: String, required: true, trim: true, index: true },
  dateOfBirth: { type: Date, required: true },
  dateOfAdmission: { type: Date },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  caste: { type: String, trim: true },
  category: { type: String, trim: true },
  bloodGroup: { type: String, trim: true },
  bankDetails: { type: String, trim: true },
  address: { type: String, trim: true },
  mobile: { type: String, trim: true, index: true },
  profileImage: { type: String, trim: true },
  isActive: { type: Boolean, default: true, index: true },
});

studentSchema.index({ tenantId: 1, class: 1, isActive: 1 });
studentSchema.index({ tenantId: 1, admNo: 1 }, { unique: true });
studentSchema.index({ tenantId: 1, studentName: 1 });

applyBaseSchema(studentSchema);

export const Student = mongoose.model('Student', studentSchema);
