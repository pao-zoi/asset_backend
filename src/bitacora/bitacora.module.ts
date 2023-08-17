import { Module } from '@nestjs/common';
import { BitacoraService } from './bitacora.service';
import { BitacoraController } from './bitacora.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Bitacora, BitacoraSchema } from './schema/bitacora.schema';
import { LoggerInterceptor } from 'src/interceptors/loggerInterceptors';
import { HttpModule } from '@nestjs/axios';
import { CustomErrorService } from 'src/error.service';

@Module({
  imports:[
    MongooseModule.forFeature([
      {name:Bitacora.name, schema:BitacoraSchema}
      
    ]),
    HttpModule
  ],
  controllers: [BitacoraController],
  providers: [LoggerInterceptor,BitacoraService,CustomErrorService]
})
export class BitacoraModule {}
