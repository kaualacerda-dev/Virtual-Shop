import {
    IsString,
    MinLength,
    MaxLength,
    IsOptional,
    IsNotEmpty,
    IsNumber,
} from 'class-validator';

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
    description: string;

    @IsString()
    imageUrl: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(10)
    sku: string;

    @IsNumber()
    @IsNotEmpty()
    price: number;

    @IsNumber()
    @IsNotEmpty()
    @MinLength(1)
    stock: number;


}