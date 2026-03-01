import { Module } from '@nestjs/common';
import { UploadsController, UploadsService } from './uploads.controller';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
