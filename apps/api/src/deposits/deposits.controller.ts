import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AuthRequest } from '../common/types/auth-request.type';
import { DepositsService } from './deposits.service';
import { CreateDepositDto } from './dto/create-deposit.dto';

@Controller('deposits')
export class DepositsController {
  constructor(private readonly depositsService: DepositsService) {}

  // 사용자별 입금 내역 조회
  @Get()
  @UseGuards(JwtAuthGuard)
  async getDeposits(@Req() request: AuthRequest) {
    return this.depositsService.getDeposits(request.user.email);
  }

  // 입금 시뮬레이션 (실제로는 블록체인 이벤트 리스너가 호출)
  @Post()
  @UseGuards(JwtAuthGuard)
  async createDeposit(
    @Req() request: AuthRequest,
    @Body() dto: CreateDepositDto,
  ) {
    return this.depositsService.createDeposit(request.user.email, dto);
  }

  // 입금 확인 (관리자용, 실제로는 블록체인 확인 후 자동 호출)
  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard)
  async confirmDeposit(@Param('id') id: string) {
    return this.depositsService.confirmDeposit(id);
  }
}
