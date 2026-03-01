import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

type BucketName =
  | 'avatars'
  | 'banners'
  | 'portfolio_projects'
  | 'identity_documents';

export class SignedUrlDto {
  @IsEnum(['avatars', 'banners', 'portfolio_projects', 'identity_documents'])
  bucket: BucketName;

  @IsString() fileName: string;
  @IsString() fileType: string;
  @IsNumber() @Min(1) @Max(20 * 1024 * 1024) fileSize: number;
}

export class ConfirmAvatarDto {
  @IsString() avatar_url: string;
}

export class ConfirmBannerDto {
  @IsString() banner_url: string;
}
