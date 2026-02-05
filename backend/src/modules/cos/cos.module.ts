import { Module } from '@nestjs/common';
import { CosService } from './cos.service';
import { Configurations } from '@/config';
import { CosController } from './cos.controller';

@Module({
  controllers: [CosController],
  imports: [Configurations],
  providers: [CosService],
  exports: [CosService],
})
export class CosModule { }
