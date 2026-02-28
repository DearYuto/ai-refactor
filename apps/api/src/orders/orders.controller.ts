import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AuthRequest } from '../common/types/auth-request.type';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getOrders(@Req() request: AuthRequest) {
    const orders = await this.ordersService.getOrders(request.user.email);
    return { orders };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createOrder(@Req() request: AuthRequest, @Body() body: CreateOrderDto) {
    const order = await this.ordersService.createOrder(
      request.user.email,
      body,
    );
    return { order };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async cancelOrder(
    @Req() request: AuthRequest,
    @Param('id') id: string,
  ) {
    const order = await this.ordersService.cancelOrder(
      request.user.email,
      id,
    );
    return { order };
  }
}
