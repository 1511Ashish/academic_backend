import { success } from '../../utils/response.js';
import { getStudentMarksheets, importStudentMarksheets } from './marksheet.service.js';

export async function importStudentMarksheetsController(req, res, next) {
  try {
    const data = await importStudentMarksheets({
      file: req.file,
      body: req.body,
      tenantId: req.tenantId,
    });

    return success(res, data, 'Marksheets imported', 201);
  } catch (error) {
    return next(error);
  }
}

export async function getStudentMarksheetsController(req, res, next) {
  try {
    const data = await getStudentMarksheets(req.tenantId, req.query);
    return success(res, data, 'Marksheets fetched');
  } catch (error) {
    return next(error);
  }
}
