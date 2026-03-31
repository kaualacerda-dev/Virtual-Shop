import {
  Controller,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

type RequestWithUser = {
  user: { userId: string; email: string; role: string };
};

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: RequestWithUser) {
    return this.usersService.getMe(req.user.userId);
  }

}
