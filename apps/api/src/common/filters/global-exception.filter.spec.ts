import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { LoggerService } from '../logger/logger.service';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let logger: LoggerService;

  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockRequest = () => ({
    url: '/api/test',
    method: 'GET',
  });

  const mockArgumentsHost = (req: any, res: any): ArgumentsHost => {
    return {
      switchToHttp: () => ({
        getResponse: () => res,
        getRequest: () => req,
      }),
    } as any;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalExceptionFilter,
        {
          provide: LoggerService,
          useValue: {
            error: jest.fn(),
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('HttpException을 올바른 형식으로 응답해야 합니다', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      const host = mockArgumentsHost(req, res);
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

      // Act
      filter.catch(exception, host);

      // Assert
      expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Not Found',
        error: 'InternalServerError',
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });

    it('객체 형식의 HttpException 응답을 처리해야 합니다', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      const host = mockArgumentsHost(req, res);
      const exception = new HttpException(
        {
          message: 'Validation failed',
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );

      // Act
      filter.catch(exception, host);

      // Assert
      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        error: 'Bad Request',
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });

    it('일반 Error를 500 상태로 응답해야 합니다', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      const host = mockArgumentsHost(req, res);
      const exception = new Error('Database connection failed');

      // Act
      filter.catch(exception, host);

      // Assert
      expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Database connection failed',
        error: 'InternalServerError',
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });

    it('알 수 없는 예외를 500 상태로 응답해야 합니다', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      const host = mockArgumentsHost(req, res);
      const exception = { unknown: 'error' };

      // Act
      filter.catch(exception, host);

      // Assert
      expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: 'InternalServerError',
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });

    it('에러를 로깅해야 합니다', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      const host = mockArgumentsHost(req, res);
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      // Act
      filter.catch(exception, host);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'HTTP 400 Error: Test error',
        expect.any(String), // HttpException도 Error를 상속하므로 stack이 있음
        'GlobalExceptionFilter',
      );
    });

    it('Error의 스택 트레이스를 로깅해야 합니다', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      const host = mockArgumentsHost(req, res);
      const exception = new Error('Test error');

      // Act
      filter.catch(exception, host);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('HTTP 500 Error:'),
        expect.any(String), // stack trace
        'GlobalExceptionFilter',
      );
    });

    it('응답에 타임스탬프를 포함해야 합니다', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      const host = mockArgumentsHost(req, res);
      const exception = new HttpException('Test', HttpStatus.OK);

      // Act
      filter.catch(exception, host);

      // Assert
      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('요청 경로를 응답에 포함해야 합니다', () => {
      // Arrange
      const req = { ...mockRequest(), url: '/api/orders/123' };
      const res = mockResponse();
      const host = mockArgumentsHost(req, res);
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

      // Act
      filter.catch(exception, host);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/orders/123',
        }),
      );
    });
  });

  describe('다양한 HTTP 상태 코드 테스트', () => {
    it('401 Unauthorized를 올바르게 처리해야 합니다', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      const host = mockArgumentsHost(req, res);
      const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

      // Act
      filter.catch(exception, host);

      // Assert
      expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    });

    it('403 Forbidden을 올바르게 처리해야 합니다', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      const host = mockArgumentsHost(req, res);
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

      // Act
      filter.catch(exception, host);

      // Assert
      expect(res.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    });

    it('422 Unprocessable Entity를 올바르게 처리해야 합니다', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      const host = mockArgumentsHost(req, res);
      const exception = new HttpException('Validation Error', HttpStatus.UNPROCESSABLE_ENTITY);

      // Act
      filter.catch(exception, host);

      // Assert
      expect(res.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('에러 응답 형식 검증', () => {
    it('모든 필수 필드를 포함해야 합니다', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      const host = mockArgumentsHost(req, res);
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      // Act
      filter.catch(exception, host);

      // Assert
      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall).toHaveProperty('statusCode');
      expect(jsonCall).toHaveProperty('message');
      expect(jsonCall).toHaveProperty('error');
      expect(jsonCall).toHaveProperty('timestamp');
      expect(jsonCall).toHaveProperty('path');
    });

    it('statusCode는 숫자여야 합니다', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      const host = mockArgumentsHost(req, res);
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      // Act
      filter.catch(exception, host);

      // Assert
      const jsonCall = res.json.mock.calls[0][0];
      expect(typeof jsonCall.statusCode).toBe('number');
    });

    it('message는 문자열이어야 합니다', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      const host = mockArgumentsHost(req, res);
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      // Act
      filter.catch(exception, host);

      // Assert
      const jsonCall = res.json.mock.calls[0][0];
      expect(typeof jsonCall.message).toBe('string');
    });
  });
});
