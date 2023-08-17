import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AssetService } from './asset.service';
import { AssetController } from './asset.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Asset, AssetSchema } from './schema/asset.schema';
import { DepreciationAssetList, DepreciationAssetListSchema } from 'src/depreciation-asset-list/schema/depreciation-asset';
import { HttpModule } from '@nestjs/axios';
import { DepreciationService } from './depreciation.service';
import { Supplier, SupplierSchema } from 'src/supplier/schema/supplier.schema';
import { Ufv, UfvSchema } from '../get-ufv/schema/ufvs.schema';
import { GetUfvService } from 'src/get-ufv/get-ufv.service';
import { CustomErrorService } from 'src/error.service';
import { AssetMiddleware } from 'src/middleware/middleware.asset';
import { Permission, PermissionSchema } from 'src/permission/schema/permission.schema';
import { DocumentPdf } from './asset.documentPdf.service';
import { Bitacora, BitacoraSchema } from 'src/bitacora/schema/bitacora.schema';

@Module({
  imports: [MongooseModule.forFeature(
    [
      { name: Asset.name, schema: AssetSchema},
      { name: DepreciationAssetList.name, schema: DepreciationAssetListSchema},
      { name: Supplier.name, schema:SupplierSchema},
      { name: Ufv.name, schema:UfvSchema},
      { name:Permission.name, schema:PermissionSchema },
      {name:Bitacora.name, schema:BitacoraSchema}
      
    ]
  ),
  HttpModule,
],
  controllers: [AssetController],
  providers: [
    CustomErrorService,
    AssetService, 
    GetUfvService,
    DepreciationService,
    DocumentPdf
  ],
})
export class AssetModule {
  configure(consumer: MiddlewareConsumer){
    consumer.apply(AssetMiddleware).forRoutes(
      { path: '/asset', method: RequestMethod.POST },
      { path: '/asset/:id', method: RequestMethod.PUT },
    );
}
}
