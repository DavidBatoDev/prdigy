import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  Injectable,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../config/supabase.module';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';
import {
  ConfirmAvatarDto,
  ConfirmBannerDto,
  SignedUrlDto,
} from './dto/upload.dto';

const BUCKET_CONFIG: Record<
  string,
  { maxSize: number; allowedTypes: string[] }
> = {
  avatars: {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  banners: {
    maxSize: 10 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  portfolio_projects: {
    maxSize: 20 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  identity_documents: {
    maxSize: 10 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  },
};

@Injectable()
export class UploadsService {
  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
  ) {}

  async createSignedUrl(userId: string, dto: SignedUrlDto) {
    const config = BUCKET_CONFIG[dto.bucket];
    if (!config) throw new BadRequestException('Invalid bucket');

    if (dto.fileSize > config.maxSize) {
      throw new BadRequestException(
        `File too large. Max size for ${dto.bucket} is ${config.maxSize / 1024 / 1024}MB`,
      );
    }

    if (!config.allowedTypes.includes(dto.fileType)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${config.allowedTypes.join(', ')}`,
      );
    }

    const ext = dto.fileName.split('.').pop();
    const path = `${userId}/${Date.now()}.${ext}`;

    const { data, error } = await this.supabase.storage
      .from(dto.bucket)
      .createSignedUploadUrl(path);

    if (error) throw new BadRequestException(error.message);
    return { signedUrl: data.signedUrl, path, token: data.token };
  }

  async confirmAvatar(userId: string, dto: ConfirmAvatarDto) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update({ avatar_url: dto.avatar_url })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async confirmBanner(userId: string, dto: ConfirmBannerDto) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update({ banner_url: dto.banner_url })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async deleteAvatar(userId: string) {
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    if ((profile as Record<string, string> | null)?.avatar_url) {
      const path = (profile as Record<string, string>).avatar_url
        .split('/')
        .pop();
      if (path) {
        await this.supabase.storage
          .from('avatars')
          .remove([`${userId}/${path}`]);
      }
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }
}

@Controller('uploads')
@UseGuards(SupabaseAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('signed-url')
  createSignedUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SignedUrlDto,
  ) {
    return this.uploadsService.createSignedUrl(user.id, dto);
  }

  @Post('confirm-avatar')
  confirmAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConfirmAvatarDto,
  ) {
    return this.uploadsService.confirmAvatar(user.id, dto);
  }

  @Post('confirm-banner')
  confirmBanner(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConfirmBannerDto,
  ) {
    return this.uploadsService.confirmBanner(user.id, dto);
  }

  @Delete('avatar')
  @HttpCode(HttpStatus.OK)
  deleteAvatar(@CurrentUser() user: AuthenticatedUser) {
    return this.uploadsService.deleteAvatar(user.id);
  }
}
