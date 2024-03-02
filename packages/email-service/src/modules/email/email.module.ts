import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { SendGridService } from 'src/sendgrid.service';

@Module({
  controllers: [EmailController],
  providers: [EmailService, SendGridService],
})
export class EmailModule {}
