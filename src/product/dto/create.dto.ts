import {
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ProductCategory } from '@prisma/client';

export class CreateDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(14)
  name: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(100)
  description?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(10)
  sku: string;

  @IsNumberString()
  @IsNotEmpty()
  price: string;

  @IsNumberString()
  @IsNotEmpty()
  stock: string;

  @IsNotEmpty()
  @IsEnum(ProductCategory)
  category: ProductCategory;
}
