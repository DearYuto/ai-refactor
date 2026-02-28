import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MatchingEngineService } from './matching.service';

/**
 * 매칭 엔진 스케줄러
 *
 * 역할:
 * - 1초마다 자동으로 매칭 엔진 실행
 * - 크론 작업 관리
 */
@Injectable()
export class MatchingScheduler {
  private readonly logger = new Logger(MatchingScheduler.name);

  constructor(private readonly matchingEngine: MatchingEngineService) {}

  /**
   * 1초마다 매칭 엔진 실행
   */
  @Cron(CronExpression.EVERY_SECOND)
  async handleMatchingCron(): Promise<void> {
    try {
      await this.matchingEngine.matchAllMarkets();
    } catch (error) {
      this.logger.error(`크론 매칭 실패: ${error.message}`);
    }
  }
}
