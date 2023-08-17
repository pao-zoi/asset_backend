import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DepreciationAssetListDocument = HydratedDocument<DepreciationAssetList>;

@Schema()
export class DepreciationAssetList {
    @Prop({require:true})
    assetCategory: string; 
    
    @Prop({require:true})
    usefulLife: number;

    @Prop({ default: false })
    isDeleted?: boolean;  

}

export const DepreciationAssetListSchema = SchemaFactory.createForClass(DepreciationAssetList);



