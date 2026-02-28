import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AuthRequest } from '../common/types/auth-request.type';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  async getBalance(@Req() request: AuthRequest) {
    const balances = await this.walletService.getBalances(request.user.email);
    return { balances };
  }
}
