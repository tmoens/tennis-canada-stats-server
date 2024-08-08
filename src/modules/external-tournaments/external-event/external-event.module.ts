import { Module } from '@nestjs/common';
import { ExternalEventController } from './external-event.controller';
import { ExternalEventService } from './external-event.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalEvent } from './external-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExternalEvent])],
  providers: [ExternalEventService],
  controllers: [ExternalEventController],
  exports: [ExternalEventService],
})
export class ExternalEventModule {}
