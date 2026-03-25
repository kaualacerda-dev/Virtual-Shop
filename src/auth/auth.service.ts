import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // 1) Verifica se já existe usuário com esse email
    const userExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (userExists) {
      throw new BadRequestException('Email já está em uso');
    }

    // 2) "Esconder" a senha: hash
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 3) Criar usuário no banco
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: passwordHash,
        name: dto.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // 4) Opcional: já devolver token junto (muito comum)
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });

    return { user, accessToken };
  }

  async login(dto: LoginDto) {
    // 1) Busca usuário pelo email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // se não existe, já falha (não entrega detalhe demais)
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2) Comparar senha digitada com senha do banco (hash)
    const ok = await bcrypt.compare(dto.password, user.password);

    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3) Gerar token
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });

    // 4) Devolver token + infos básicas
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    };
  }
}
