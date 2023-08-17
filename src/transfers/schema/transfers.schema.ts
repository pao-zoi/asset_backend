import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type TransfersDocument = HydratedDocument<Transfers>;

@Schema({timestamps:true})
export class Transfers {
    @Prop([{ type: 
        { 
            _id:false,
            assetId:{type: mongoose.Schema.Types.String, ref: 'Asset'},
            date: { type: Date, default:new Date(Date.now() - 4 * 60 * 60 * 1000) },
        }   
    }])
    asset: Array<{ assetId: string; date: Date }>
    
    @Prop({ required: true, type: mongoose.Schema.Types.Mixed }) 
    intruded:string;//por intrucciones de quien se realiza la transferenia 

    @Prop({ required: true, type: mongoose.Schema.Types.Mixed })
    origin:string;//origen del activo

    @Prop({ required: true, type: mongoose.Schema.Types.Mixed })
    destination:string;//nueva ubicacion 
  
    @Prop({ required: true, type: mongoose.Schema.Types.Mixed })
    personalNew:string;//nueva personal asignado al activo
    
    @Prop({ required: true, type: mongoose.Schema.Types.Mixed })
    previousPersonal:string;// anterior personal

    @Prop({trim:true})
    reason:string; //motivo por el cual se realiza la transferencia 
    
    @Prop({ default:false })
    isDeleted: Boolean;

    @Prop({ required: true, type: mongoose.Schema.Types.Mixed })
    pdf: string;

}

export const TransfersSchema = SchemaFactory.createForClass(Transfers);