import { Controller, Get, Param } from '@nestjs/common';
import { ConsultantsService } from './consultants.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('consultants')
export class ConsultantsController {
  constructor(private readonly consultantsService: ConsultantsService) {}

  @Get()
  @Public()
  findAll() {
    return this.consultantsService.findAll();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.consultantsService.findOne(id);
  }
}
