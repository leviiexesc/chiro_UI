export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(code: string, message: string, statusCode = 400, details?: any) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", code = "NOT_FOUND") {
    super(code, message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access", code = "UNAUTHORIZED") {
    super(code, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden operation", code = "FORBIDDEN") {
    super(code, message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict", code = "CONFLICT") {
    super(code, message, 409);
  }
}
