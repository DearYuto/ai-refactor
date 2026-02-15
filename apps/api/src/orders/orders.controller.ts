import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AuthRequest } from '../common/types/auth-request.type';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getOrders(@Req() request: AuthRequest) {
    return { orders: this.ordersService.getOrders(request.user.email) };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createOrder(
    @Req() request: AuthRequest,
    @Body() body: CreateOrderDto,
  ) {
    const order = await this.ordersService.createOrder(
      request.user.email,
      body,
    );
    return { order };
  }
}
