import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    const data = await this.adminService.getStats();
    return {
      success: true,
      data,
    };
  }

  @Get('users')
  async getAllUsers() {
    const data = await this.adminService.getAllUsers();
    return {
      success: true,
      data,
    };
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id') targetUserId: string,
    @Body('role') newRole: string,
  ) {
    const data = await this.adminService.updateUserRole(targetUserId, newRole);
    return {
      success: true,
      data,
    };
  }
}
