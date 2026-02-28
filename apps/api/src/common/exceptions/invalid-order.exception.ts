import { HttpException, HttpStatus } from '@nestjs/common';

export class InvalidOrderException extends HttpException {
  constructor(reason: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Invalid order: ${reason}`,
        error: 'InvalidOrder',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
