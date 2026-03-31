import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateDto } from './dto/create.dto';
import { ProductService } from './product.service';

type UploadedImageFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

@Controller('product')
export class ProductController {
  constructor(private productService: ProductService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('create')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async create(
    @Body() dto: CreateDto,
    @UploadedFile() file?: UploadedImageFile,
  ) {
    if (!file && !dto.imageUrl) {
      throw new BadRequestException(
        'Envie uma imagem no campo "image" ou informe imageUrl.',
      );
    }

    return this.productService.create(dto, file);
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.productService.delete(Number(id));
  }
}
