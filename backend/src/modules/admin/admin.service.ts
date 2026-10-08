import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserProgress, UserProgressDocument } from '../../schemas';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserProgress.name) private progressModel: Model<UserProgressDocument>,
  ) {}

  async getStats() {
    const totalUsers = await this.userModel.countDocuments();
    const premiumUsers = await this.userModel.countDocuments({ role: 'premium' });
    const adminUsers = await this.userModel.countDocuments({ role: 'admin' });
    const standardUsers = await this.userModel.countDocuments({ role: { $in: ['user', null, ''] } });

    const allUsers = await this.userModel.find().select('aiQueriesCount').lean();
    const totalAiQueries = allUsers.reduce((sum, u) => sum + (u.aiQueriesCount || 0), 0);

    return {
      totalUsers,
      standardUsers,
      premiumUsers,
      adminUsers,
      totalAiQueries,
    };
  }

  async getAllUsers() {
    const users = await this.userModel
      .find()
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();

    const userIds = users.map((u) => u._id);
    const progressList = await this.progressModel
      .find({ userId: { $in: userIds } })
      .lean();

    const progressMap = new Map();
    progressList.forEach((p) => {
      progressMap.set(p.userId.toString(), p);
    });

    return users.map((u) => {
      const p = progressMap.get(u._id.toString());
      return {
        id: u._id.toString(),
        email: u.email,
        name: u.name,
        avatar: u.avatar,
        role: u.role || 'user',
        createdAt: (u as any).createdAt ? new Date((u as any).createdAt).toISOString() : new Date().toISOString(),
        xp: p?.xp || 0,
        streak: p?.streakCount || 0,
        currentLevel: p?.currentLevel || 'A1',
        aiQueriesCount: u.aiQueriesCount || 0,
      };
    });
  }

  async updateUserRole(targetUserId: string, newRole: string) {
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('ID người dùng không hợp lệ.');
    }

    if (!['user', 'premium', 'admin'].includes(newRole)) {
      throw new BadRequestException('Role không hợp lệ. Phải là "user", "premium" hoặc "admin".');
    }

    const updated = await this.userModel.findByIdAndUpdate(
      targetUserId,
      { role: newRole },
      { new: true },
    ).select('-passwordHash').lean();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy người dùng cần cập nhật.');
    }

    return {
      id: updated._id.toString(),
      email: updated.email,
      name: updated.name,
      role: updated.role,
      avatar: updated.avatar,
      createdAt: (updated as any).createdAt,
    };
  }
}
