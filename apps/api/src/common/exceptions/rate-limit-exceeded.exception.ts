import { HttpException, HttpStatus } from '@nestjs/common';

export class RateLimitExceededException extends HttpException {
  constructor(retryAfter?: number) {
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: `Rate limit exceeded${retryAfter ? `. Retry after ${retryAfter} seconds` : ''}`,
        error: 'RateLimitExceeded',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
