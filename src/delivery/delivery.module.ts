import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Delivery, DeliverySchema } from './schema/delivery.schema';
import { AssetService } from 'src/asset/asset.service';
import { Asset, AssetSchema } from 'src/asset/schema/asset.schema';
import { CustomErrorService } from 'src/error.service';
import { HttpModule } from '@nestjs/axios';
import { DeliveryCertificate } from './delivery.certificate.service';
import { Bitacora, BitacoraSchema } from 'src/bitacora/schema/bitacora.schema';

@Module({
  imports:[MongooseModule.forFeature([
    {name: Delivery.name, schema:DeliverySchema},
    { name: Asset.name, schema: AssetSchema},
    {name:Bitacora.name, schema:BitacoraSchema}
  ]),
  HttpModule
],
  controllers: [DeliveryController],
  providers: [        
    DeliveryService,
    CustomErrorService,
    DeliveryCertificate
  ]
})
export class DeliveryModule {}
