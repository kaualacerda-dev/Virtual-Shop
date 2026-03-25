import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Get,
  BadRequestException,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductService } from './product.service';
import { CreateDto } from './dto/create.dto';

type RequestWithProduct = {
  product: {
    productId: number;
    name: string;
    sku: string;
    price: number;
    description: string;
  };
};

@Controller('product')
export class ProductController {
  constructor(private productService: ProductService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(@Body() dto: CreateDto) {
    return this.productService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sku') sku?: string,
    @Query('name') name?: string,
    @Query('orderBy') orderBy?: 'price' | 'createdAt',
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.productService.getProducts({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      sku,
      name,
      orderBy,
      order,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  Delete(@Param('id') id: string) {
    return this.productService.delete(Number(id));
  }
}
