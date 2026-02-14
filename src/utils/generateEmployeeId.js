import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: false, versionKey: false }
);

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

export async function generateEmployeeId() {
  const year = new Date().getUTCFullYear();
  const key = `employee-id-${year}`;

  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return `EMP-${year}-${String(counter.seq).padStart(4, '0')}`;
}
