import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

export interface AuthenticatedUserPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Yêu cầu xác thực: Vui lòng đăng nhập để tiếp tục.');
    }

    const token = authHeader.split(' ')[1];
    const secret = this.configService.get<string>('JWT_SECRET') || 'write_duo_secret_key_2026';

    try {
      const decoded = jwt.verify(token, secret) as any;
      request.user = {
        userId: decoded.sub || decoded.userId,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role || 'user',
      } as AuthenticatedUserPayload;
      return true;
    } catch (err: any) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }
}

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      request.user = null;
      return true;
    }

    const token = authHeader.split(' ')[1];
    const secret = this.configService.get<string>('JWT_SECRET') || 'write_duo_secret_key_2026';

    try {
      const decoded = jwt.verify(token, secret) as any;
      request.user = {
        userId: decoded.sub || decoded.userId,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role || 'user',
      } as AuthenticatedUserPayload;
    } catch {
      request.user = null;
    }
    return true;
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Yêu cầu quyền Quản trị viên: Vui lòng đăng nhập tài khoản Admin.');
    }

    const token = authHeader.split(' ')[1];
    const secret = this.configService.get<string>('JWT_SECRET') || 'write_duo_secret_key_2026';

    try {
      const decoded = jwt.verify(token, secret) as any;
      const user = {
        userId: decoded.sub || decoded.userId,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role || 'user',
      } as AuthenticatedUserPayload;

      request.user = user;

      if (user.role !== 'admin') {
        throw new UnauthorizedException('Từ chối truy cập: Chỉ tài khoản Admin mới có quyền thực hiện thao tác này.');
      }

      return true;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc không có quyền Admin.');
    }
  }
}
