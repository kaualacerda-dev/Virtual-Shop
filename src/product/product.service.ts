import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDto } from './dto/create.dto';

type UploadedImageFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDto, file?: UploadedImageFile) {
    const productExists = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });

    if (productExists) {
      throw new BadRequestException('Produto já existe!');
    }

    const price = Number(dto.price);
    const stock = Number(dto.stock);

    if (Number.isNaN(price) || Number.isNaN(stock)) {
      throw new BadRequestException('price e stock precisam ser numéricos.');
    }

    const uploadedImage = file ? await this.uploadImage(file) : null;
    const imageUrl = uploadedImage?.url || dto.imageUrl;

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        category: dto.category,
        price,
        stock,
        sku: dto.sku,
        imageUrl,
        description: dto.description,
      },
      select: this.productSelect,
    });

    return { product };
  }

  async uploadImage(file: UploadedImageFile) {
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Apenas arquivos de imagem são permitidos.');
    }

    const uploadUrl = process.env.IMGBB_API_URL;

    if (!uploadUrl) {
      throw new InternalServerErrorException(
        'IMGBB_API_URL não configurada no ambiente.',
      );
    }

    const requestUrl = new URL(uploadUrl);
    const apiKey = process.env.IMGBB_API_KEY;

    if (apiKey && !requestUrl.searchParams.has('key')) {
      requestUrl.searchParams.set('key', apiKey);
    }

    const payload = new URLSearchParams();
    payload.append('image', file.buffer.toString('base64'));
    payload.append('name', file.originalname);

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload,
    });

    const result = (await response.json()) as {
      success?: boolean;
      data?: {
        url?: string;
        display_url?: string;
        delete_url?: string;
      };
      error?: {
        message?: string;
      };
    };

    if (!response.ok || !result.success || !result.data?.url) {
      throw new BadRequestException(
        result.error?.message || 'Falha ao enviar imagem para o ImgBB.',
      );
    }

    return {
      url: result.data.url,
      displayUrl: result.data.display_url,
      deleteUrl: result.data.delete_url,
    };
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
      sku,
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
      select: this.productSelect,
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

  private readonly productSelect = {
    id: true,
    sku: true,
    stock: true,
    price: true,
    description: true,
    imageUrl: true,
    name: true,
    category: true,
    createdAt: true,
  } satisfies Prisma.ProductSelect;
}
