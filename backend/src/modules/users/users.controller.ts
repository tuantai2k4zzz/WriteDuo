import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users/me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser('userId') userId: string) {
    const data = await this.usersService.getMe(userId);
    return {
      success: true,
      data,
    };
  }

  @Get('users/learning-profile')
  @UseGuards(JwtAuthGuard)
  async getLearningProfile(@CurrentUser('userId') userId: string) {
    const data = await this.usersService.getLearningProfile(userId);
    return {
      success: true,
      data,
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@CurrentUser('userId') userId: string) {
    const data = await this.usersService.getStats(userId);
    return {
      success: true,
      data,
    };
  }
}
