import mongoose from 'mongoose';
import { applyBaseSchema } from '../../core/base.model.js';

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'late'], required: true },
  remarks: { type: String },
});

attendanceSchema.index({ tenantId: 1, studentId: 1, date: 1 }, { unique: true });

applyBaseSchema(attendanceSchema);

export const Attendance = mongoose.model('Attendance', attendanceSchema);
