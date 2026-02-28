import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { TradesService } from './trades.service';
import { JwtAuthGuard } from '../auth/auth.guard';

/**
 * 거래 내역 컨트롤러
 *
 * 엔드포인트:
 * - GET /trades - 최근 거래 내역 (public)
 * - GET /trades/my - 내 거래 내역 (JWT 필요)
 * - GET /trades/volume - 거래량 통계 (public)
 */
@ApiTags('trades')
@Controller('trades')
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  /**
   * 최근 거래 내역 조회 (public)
   *
   * @param source - 마켓 소스 (예: 'BTC-USDT')
   * @param limit - 조회 개수 (기본: 50, 최대: 200)
   */
  @Get()
  @ApiOperation({ summary: '최근 거래 내역 조회 (public)' })
  @ApiQuery({ name: 'source', example: 'BTC-USDT' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  async getRecentTrades(
    @Query('source') source: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Math.min(parseInt(limit, 10), 200) : 50;
    return this.tradesService.getRecentTrades(source, parsedLimit);
  }

  /**
   * 내 거래 내역 조회 (private)
   *
   * @param req - JWT 토큰에서 userId 추출
   * @param source - 마켓 소스 (선택)
   * @param limit - 조회 개수 (기본: 100, 최대: 500)
   */
  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 거래 내역 조회 (JWT 필요)' })
  @ApiQuery({ name: 'source', required: false, example: 'BTC-USDT' })
  @ApiQuery({ name: 'limit', required: false, example: 100 })
  async getMyTrades(
    @Request() req: any,
    @Query('source') source?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.userId;
    const parsedLimit = limit ? Math.min(parseInt(limit, 10), 500) : 100;
    return this.tradesService.getMyTrades(userId, source, parsedLimit);
  }

  /**
   * 거래량 통계 조회 (public)
   *
   * @param source - 마켓 소스
   * @param hours - 시간 범위 (기본: 24시간)
   */
  @Get('volume')
  @ApiOperation({ summary: '거래량 통계 조회 (public)' })
  @ApiQuery({ name: 'source', example: 'BTC-USDT' })
  @ApiQuery({ name: 'hours', required: false, example: 24 })
  async getVolumeStats(
    @Query('source') source: string,
    @Query('hours') hours?: string,
  ) {
    const parsedHours = hours ? parseInt(hours, 10) : 24;
    return this.tradesService.getVolumeStats(source, parsedHours);
  }
}
