import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentCheckpointDto {
  @IsUUID() project_id: string;
  @IsUUID() @IsOptional() milestone_id?: string;
  @IsNumber() @Min(0) amount: number;
  @IsUUID() payee_id: string;
  @IsString() @IsOptional() description?: string;
}

export class WalletTransactionsQueryDto {
  @IsString() @IsOptional() type?: string;
  @IsUUID() @IsOptional() project_id?: string;
  @IsNumber() @IsOptional() @Type(() => Number) page?: number = 1;
  @IsNumber() @IsOptional() @Type(() => Number) limit?: number = 20;
}

export class AdminDepositDto {
  @IsUUID() user_id: string;
  @IsNumber() @Min(0.01) amount: number;
  @IsString() @IsOptional() description?: string;
}
