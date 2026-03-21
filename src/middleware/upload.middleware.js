import multer from 'multer';
import { cloudinary } from '../config/cloudinary.js';
import { isCloudinaryConfigured } from '../config/env.js';
import { ApiError } from '../utils/response.js';

const storage = multer.memoryStorage();

const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const allowedExcelMime = new Set([
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
  'application/octet-stream',
]);

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMime.has(file.mimetype)) {
      return cb(new ApiError(400, 'Only image uploads are allowed'));
    }
    return cb(null, true);
  },
});

export const excelUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const lowerCaseName = file.originalname.toLowerCase();
    const isExcelName = lowerCaseName.endsWith('.xlsx') || lowerCaseName.endsWith('.xls') || lowerCaseName.endsWith('.csv');

    if (!allowedExcelMime.has(file.mimetype) && !isExcelName) {
      return cb(new ApiError(400, 'Only Excel or CSV uploads are allowed'));
    }

    return cb(null, true);
  },
});

export function uploadToCloudinary(fileBuffer, folder = 'school-crm') {
  if (!isCloudinaryConfigured) {
    throw new ApiError(500, 'Cloudinary is not configured');
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) {
        return reject(error);
      }
      return resolve(result.secure_url);
    });

    stream.end(fileBuffer);
  });
}
