const express = require('express');
const FeeRecord = require('../models/FeeRecord');
const Student = require('../models/Student');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function parseMonth(month) {
  const monthNum = Number(month);
  if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
    return { error: 'month must be an integer between 1 and 12' };
  }
  return { month: monthNum };
}

function parseYear(year) {
  const yearNum = Number(year);
  if (!Number.isInteger(yearNum) || yearNum < 2000 || yearNum > 2100) {
    return { error: 'year must be a valid 4-digit year' };
  }
  return { year: yearNum };
}

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { studentId, month, year, amountDue, amountPaid, dueDate, notes } = req.body || {};

    if (!studentId || month === undefined || year === undefined || amountDue === undefined) {
      return res.status(400).json({ message: 'studentId, month, year, and amountDue are required' });
    }

    const parsedMonth = parseMonth(month);
    if (parsedMonth.error) return res.status(400).json({ message: parsedMonth.error });
    const parsedYear = parseYear(year);
    if (parsedYear.error) return res.status(400).json({ message: parsedYear.error });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const amountDueNum = Number(amountDue);
    const amountPaidNum = amountPaid === undefined ? 0 : Number(amountPaid);

    if (!Number.isFinite(amountDueNum) || !Number.isFinite(amountPaidNum)) {
      return res.status(400).json({ message: 'amountDue and amountPaid must be numbers' });
    }

    const fee = await FeeRecord.create({
      student: student.id,
      month: parsedMonth.month,
      year: parsedYear.year,
      amountDue: amountDueNum,
      amountPaid: amountPaidNum,
      dueDate,
      notes,
    });

    return res.status(201).json(fee);
  } catch (err) {
    return next(err);
  }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { studentId, month, year, status } = req.query || {};
    const filter = {};

    if (studentId) filter.student = studentId;
    if (month !== undefined) filter.month = Number(month);
    if (year !== undefined) filter.year = Number(year);
    if (status) filter.status = String(status);

    const fees = await FeeRecord.find(filter).sort({ year: -1, month: -1 }).lean();
    return res.json({ count: fees.length, fees });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const fee = await FeeRecord.findById(req.params.id).lean();
    if (!fee) return res.status(404).json({ message: 'Fee record not found' });
    return res.json(fee);
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const update = {};
    const { month, year, amountDue, amountPaid, dueDate, notes } = req.body || {};

    if (month !== undefined) {
      const parsedMonth = parseMonth(month);
      if (parsedMonth.error) return res.status(400).json({ message: parsedMonth.error });
      update.month = parsedMonth.month;
    }

    if (year !== undefined) {
      const parsedYear = parseYear(year);
      if (parsedYear.error) return res.status(400).json({ message: parsedYear.error });
      update.year = parsedYear.year;
    }

    if (amountDue !== undefined) {
      const amountDueNum = Number(amountDue);
      if (!Number.isFinite(amountDueNum)) {
        return res.status(400).json({ message: 'amountDue must be a number' });
      }
      update.amountDue = amountDueNum;
    }

    if (amountPaid !== undefined) {
      const amountPaidNum = Number(amountPaid);
      if (!Number.isFinite(amountPaidNum)) {
        return res.status(400).json({ message: 'amountPaid must be a number' });
      }
      update.amountPaid = amountPaidNum;
    }
    if (dueDate !== undefined) update.dueDate = dueDate;
    if (notes !== undefined) update.notes = notes;

    if (!Object.keys(update).length) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const fee = await FeeRecord.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Fee record not found' });

    Object.assign(fee, update);
    await fee.save();

    return res.json(fee);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
