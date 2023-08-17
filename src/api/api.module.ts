import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { HttpModule } from '@nestjs/axios';
// import { RolesGuard } from './roles.guard';

@Module({
    imports: [
        HttpModule
    ],
    providers: [],
    controllers: [ApiController],
  })
export class ApiModule {}