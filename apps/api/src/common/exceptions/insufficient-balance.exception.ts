import { HttpException, HttpStatus } from '@nestjs/common';

export class InsufficientBalanceException extends HttpException {
  constructor(asset: string, required: number, available: number) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Insufficient ${asset} balance. Required: ${required}, Available: ${available}`,
        error: 'InsufficientBalance',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
