import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AuthRequest } from '../common/types/auth-request.type';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  // 사용자별 출금 내역 조회
  @Get()
  @UseGuards(JwtAuthGuard)
  async getWithdrawals(@Req() request: AuthRequest) {
    return this.withdrawalsService.getWithdrawals(request.user.email);
  }

  // 출금 요청 (Rate Limiting: 60초당 3회)
  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async requestWithdrawal(
    @Req() request: AuthRequest,
    @Body() dto: CreateWithdrawalDto,
  ) {
    return this.withdrawalsService.requestWithdrawal(request.user.email, dto);
  }

  // 출금 승인 (관리자용)
  @Post(':id/approve')
  @UseGuards(JwtAuthGuard)
  async approveWithdrawal(@Param('id') id: string) {
    return this.withdrawalsService.approveWithdrawal(id);
  }

  // 출금 거부 (관리자용)
  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
  async rejectWithdrawal(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.withdrawalsService.rejectWithdrawal(id, reason);
  }
}
