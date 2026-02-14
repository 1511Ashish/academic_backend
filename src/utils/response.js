export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function success(res, data = {}, message = 'OK', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function failure(res, message = 'Error', status = 500) {
  return res.status(status).json({ success: false, message });
}

export function badRequest(res, message = 'Bad request') {
  return failure(res, message, 400);
}

export function unauthorized(res, message = 'Unauthorized') {
  return failure(res, message, 401);
}

export function forbidden(res, message = 'Forbidden') {
  return failure(res, message, 403);
}

export function notFound(res, message = 'Not found') {
  return failure(res, message, 404);
}
