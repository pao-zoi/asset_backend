import { Module } from '@nestjs/common';
import { DevolutionService } from './devolution.service';
import { DevolutionController } from './devolution.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Devolution, DevolutionSchema } from './schema/devolution.schema';
import { Asset, AssetSchema } from 'src/asset/schema/asset.schema';
import { Delivery, DeliverySchema } from 'src/delivery/schema/delivery.schema';
import { CustomErrorService } from 'src/error.service';
import { HttpModule } from '@nestjs/axios';
import { DevolutionCertificate } from './devolution.certificate.service';
import { Bitacora, BitacoraSchema } from 'src/bitacora/schema/bitacora.schema';

@Module({
  imports:[MongooseModule.forFeature([
    { name:Devolution.name, schema:DevolutionSchema },
    { name:Asset.name, schema:AssetSchema },
    { name:Delivery.name, schema:DeliverySchema },
    {name:Bitacora.name, schema:BitacoraSchema}
  ]),
  HttpModule
],
  controllers: [DevolutionController],
  providers: [
    DevolutionService,
    CustomErrorService, 
    DevolutionCertificate
  ]
})
export class DevolutionModule {}
