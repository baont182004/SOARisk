import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiErrorResponse } from '@soc-soar/shared';

type ExceptionBody = {
  error?: string;
  message?: string | string[];
};

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse = exception instanceof HttpException ? exception.getResponse() : undefined;
    const exceptionBody = typeof rawResponse === 'string' ? { message: rawResponse } : rawResponse;

    const normalizedBody = exceptionBody as ExceptionBody | undefined;
    const details = normalizedBody?.message;
    const message = Array.isArray(details)
      ? details.join('; ')
      : (details ?? 'An unexpected error occurred.');

    const errorResponseBase = {
      success: false as const,
      message,
      error:
        normalizedBody?.error ??
        (exception instanceof Error ? exception.name : 'InternalServerError'),
      statusCode,
      path: request.originalUrl ?? request.url,
      timestamp: new Date().toISOString(),
    };

    const errorResponse: ApiErrorResponse =
      details === undefined
        ? errorResponseBase
        : {
            ...errorResponseBase,
            details,
          };

    response.status(statusCode).json(errorResponse);
  }
}
