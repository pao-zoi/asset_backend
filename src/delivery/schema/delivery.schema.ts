import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { DeliveryController } from '../delivery.controller';

export type DeliveryDocument = HydratedDocument<Delivery>;

@Schema({timestamps:true})
export class Delivery {

    // @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Asset' ,required: true})
    // assetId: object;
    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Asset' }], required: true })
    assetId: [string];

    @Prop({ required: true, type: mongoose.Schema.Types.Mixed })
    personId:object;

    @Prop({type:Date, default:() => new Date(Date.now() - 4 * 60 * 60 * 1000)})
    createdAt:Date;
    @Prop({type:Date,})
    updatedAt:Date;

    @Prop()
    pdf: string;

    @Prop()
    location:string; //peticion a organigrama
    
    @Prop({default:false})
    isDeleted?:boolean
}

export const DeliverySchema = SchemaFactory.createForClass(Delivery);
