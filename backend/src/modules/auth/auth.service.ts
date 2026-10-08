import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User, UserDocument, UserProgress, UserProgressDocument } from '../../schemas';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserProgress.name) private progressModel: Model<UserProgressDocument>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      const adminExists = await this.userModel.findOne({ role: 'admin' });
      if (!adminExists) {
        const defaultAdminEmail = 'admin@writeduo.com';
        const passwordHash = await bcrypt.hash('admin123', 10);
        const adminUser = await this.userModel.create({
          email: defaultAdminEmail,
          name: 'Quản Trị Viên (Admin)',
          passwordHash,
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AdminWriteDuo',
          role: 'admin',
        });
        await this.progressModel.create({
          userId: adminUser._id,
          xp: 9999,
          streakCount: 30,
          hearts: 5,
          currentLevel: 'C1',
          dailyGoalXp: 100,
          todayXp: 100,
        });
        this.logger.log(`Initialized default admin account: ${defaultAdminEmail} (password: admin123)`);
      }
    } catch (err: any) {
      this.logger.warn(`Admin seed check skipped: ${err?.message}`);
    }
  }

  private getJwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET') || 'write_duo_secret_key_2026';
  }

  private generateToken(user: UserDocument): string {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || 'user',
    };
    return jwt.sign(payload, this.getJwtSecret(), { expiresIn: '30d' });
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.userModel.findOne({ email });

    if (existing) {
      throw new ConflictException('Tài khoản với email này đã tồn tại.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const avatar =
      dto.avatar ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(dto.name.trim())}`;

    const user = await this.userModel.create({
      email,
      name: dto.name.trim(),
      passwordHash,
      avatar,
      role: 'user',
    });

    // Create fresh isolated progress for this new user
    await this.progressModel.create({
      userId: user._id,
      xp: 0,
      streakCount: 0,
      hearts: 5,
      currentLevel: 'A1',
      dailyGoalXp: 50,
      todayXp: 0,
      completedReadings: [],
      completedSentences: [],
    });

    const token = this.generateToken(user);

    return {
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role || 'user',
        createdAt: (user as any).createdAt,
      },
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash || '');
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    // Ensure user has isolated progress
    const progress = await this.progressModel.findOne({ userId: user._id });
    if (!progress) {
      await this.progressModel.create({
        userId: user._id,
        xp: 0,
        streakCount: 0,
        hearts: 5,
        currentLevel: 'A1',
        dailyGoalXp: 50,
        todayXp: 0,
        completedReadings: [],
        completedSentences: [],
      });
    }

    const token = this.generateToken(user);

    return {
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role || 'user',
        createdAt: (user as any).createdAt,
      },
    };
  }

  async getMe(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedException('ID người dùng không hợp lệ.');
    }

    const user = await this.userModel.findById(userId).select('-passwordHash').lean();
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng.');
    }

    let progress = await this.progressModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
    if (!progress) {
      const created = await this.progressModel.create({
        userId: new Types.ObjectId(userId),
        xp: 0,
        streakCount: 0,
        hearts: 5,
        currentLevel: 'A1',
        dailyGoalXp: 50,
        todayXp: 0,
      });
      progress = created.toObject();
    }

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: (user as any).role || 'user',
      createdAt: (user as any).createdAt,
      xp: progress.xp || 0,
      streak: progress.streakCount || 0,
      hearts: progress.hearts ?? 5,
      currentLevel: progress.currentLevel || 'A1',
      dailyGoalXp: progress.dailyGoalXp || 50,
      todayXp: progress.todayXp || 0,
      completedReadingsCount: (progress.completedReadings || []).length,
      completedSentencesCount: (progress.completedSentences || []).length,
    };
  }
}
