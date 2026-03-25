import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDto } from './dto/create.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDto) {
    const productExists = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });

    if (productExists) {
      throw new BadRequestException('Produto já existe!');
    }

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        price: dto.price,
        stock: dto.stock,
        sku: dto.sku,
        imageUrl: dto.imageUrl,
        description: dto.description,
      },
      select: {
        id: true,
        sku: true,
        stock: true,
        price: true,
        description: true,
        name: true,
        createdAt: true,
      },
    });

    return { product };
  }

  async getProducts(params: {
    page?: number;
    limit?: number;
    sku?: string;
    name?: string;
    orderBy?: 'price' | 'createdAt';
    order?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 10,
      sku,
      name,
      orderBy = 'createdAt',
      order = 'desc',
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      sku: sku,
      name: name
        ? {
            contains: name,
            mode: 'insensitive',
          }
        : undefined,
    };

    const products = await this.prisma.product.findMany({
      skip,
      take: limit,
      where,
      orderBy: {
        [orderBy]: order,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        price: true,
        description: true,
        createdAt: true,
      },
    });

    const total = await this.prisma.product.count({
      where,
    });

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async delete(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return this.prisma.product.delete({
      where: {
        id: productId,
      },
    });
  }
}
