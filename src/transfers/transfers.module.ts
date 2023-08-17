import { Module } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { Asset, AssetSchema } from 'src/asset/schema/asset.schema';
import { Transfers, TransfersSchema } from './schema/transfers.schema';
import { CustomErrorService } from 'src/error.service';
import { Delivery, DeliverySchema } from 'src/delivery/schema/delivery.schema';
import { Bitacora, BitacoraSchema } from 'src/bitacora/schema/bitacora.schema';
import { DeliveryCertificate } from 'src/delivery/delivery.certificate.service';
import { TransferCertificate } from './transfers.certificate.service';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: Transfers.name, schema:TransfersSchema },
      { name: Asset.name, schema: AssetSchema },
      { name: Delivery.name, schema:DeliverySchema },
      { name:Bitacora.name, schema:BitacoraSchema }
    ]),
    HttpModule
  ],
  controllers: [TransfersController],
  providers: [
    TransfersService,
    CustomErrorService,
    DeliveryCertificate,
    TransferCertificate
  ]
})
export class TransfersModule {}
