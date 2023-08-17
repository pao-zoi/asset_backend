import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';


export type DevolutionDocument = HydratedDocument<Devolution>;

@Schema({timestamps:true})
export class Devolution {

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Asset' }], required: true })
    assetId: [string];

    @Prop({required: true, default:null })
    responsibleId: string;

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

export const DevolutionSchema = SchemaFactory.createForClass(Devolution);
