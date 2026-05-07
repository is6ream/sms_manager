import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Provider } from '../providers/entities/provider.entity';
import { Route } from '../routes/entities/route.entity';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [TypeOrmModule.forFeature([Provider, Route]), AiModule],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
