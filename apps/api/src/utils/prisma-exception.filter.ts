import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '../generated/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception.code === 'P2002') {
      status = HttpStatus.CONFLICT;
      message = `Unique constraint failed on field: ${(exception.meta?.target as string[])?.join(', ')}`;
    } else if (exception.code === 'P2003') {
      status = HttpStatus.BAD_REQUEST;
      message = `Foreign key constraint failed: ${exception.meta?.field_name || 'unknown field'}. Make sure the referenced record exists.`;
    } else if (exception.code === 'P2025') {
      status = HttpStatus.NOT_FOUND;
      message = 'Record not found';
    }

    console.error(`[Prisma Error ${exception.code}] ${message}`, exception.meta);

    response.status(status).json({
      statusCode: status,
      message: message,
      error: 'PrismaError',
      code: exception.code,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
