import multer from 'multer';
import { cloudinary } from '../config/cloudinary.js';
import { isCloudinaryConfigured } from '../config/env.js';
import { ApiError } from '../utils/response.js';

const storage = multer.memoryStorage();

const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

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
