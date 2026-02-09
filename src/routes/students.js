const express = require('express');
const Student = require('../models/Student');
const FeeRecord = require('../models/FeeRecord');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function buildStudentUpdate(payload) {
  const allowed = ['name', 'fatherName', 'className', 'session', 'rollNo', 'admissionNo', 'phone', 'address'];
  const update = {};
  allowed.forEach((key) => {
    if (payload[key] !== undefined) update[key] = payload[key];
  });
  return update;
}

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, fatherName, className, session } = req.body || {};

    if (!name || !fatherName || !className || !session) {
      return res
        .status(400)
        .json({ message: 'name, fatherName, className, and session are required' });
    }

    const student = await Student.create(buildStudentUpdate(req.body));
    return res.status(201).json(student);
  } catch (err) {
    return next(err);
  }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { name, className, session, admissionNo, rollNo } = req.query || {};
    const filter = {};

    if (name) filter.name = new RegExp(String(name), 'i');
    if (className) filter.className = String(className);
    if (session) filter.session = String(session);
    if (admissionNo) filter.admissionNo = String(admissionNo);
    if (rollNo) filter.rollNo = String(rollNo);

    const students = await Student.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ count: students.length, students });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).lean();
    if (!student) return res.status(404).json({ message: 'Student not found' });
    return res.json(student);
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const update = buildStudentUpdate(req.body || {});
    if (!Object.keys(update).length) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const student = await Student.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    return res.json(student);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    await FeeRecord.deleteMany({ student: student.id });
    await student.deleteOne();

    return res.json({ message: 'Student deleted' });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/fees', authenticate, async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).lean();
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const fees = await FeeRecord.find({ student: student._id }).sort({ year: -1, month: -1 }).lean();
    return res.json({ count: fees.length, fees });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
