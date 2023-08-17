
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type AssetDocument = HydratedDocument<Asset>;
export enum ActivoState {
    available = 'AVAILABLE',
    in_use = 'IN_USE',
    in_maintenance = 'IN_MAINTENANCE',
    in_repair ='IN_REPAIR',
}

@Schema()
export class Asset {
    @Prop({trim:true, set: value => value.toUpperCase()})
    name: string; 

    @Prop({set: value => value.toUpperCase()})
    description: string;
    
    @Prop({ required: true, type: mongoose.Schema.Types.Mixed })
    responsible: object;
    
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' ,required: true})
    supplier:string;  
    
    @Prop({default:null})
    file?:string

    @Prop({ default: false })
    isDeleted?: boolean;  
    
    @Prop()
    ufv3:string // total del precio mas el aumento de la ufv

    @Prop()
    ufv4:string //aumento de la ufv menos el precio
    
    @Prop({default:0})
    depreciatedValue: number;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'DepreciationAssetList', required: true})
    typeCategoryAsset: string;  

    @Prop({ enum: Object.values(ActivoState), default: ActivoState.available })
    state: ActivoState;
    
    @Prop({ type: 
        { 
            _id:false,
            price: Number, 
            dateAcquisition: Date,
            warrantyExpirationDate:Date,
            documentPdf:String,
            lote:Number,
            code: { type: [String], unique: true },
        }   
    })
    informationCountable: { 
        price: number; 
        dateAcquisition: Date; 
        warrantyExpirationDate: Date;
        documentPdf:string;
        lote:number
        code:string[]
    };

    @Prop({ type: 
        { 
            _id:false,
            located: String, 
        } 
    })
    location: { 
        located:string
    }; 

    @Prop({ type: Date, default: Date.now })
    createdAt: Date

}


export const AssetSchema = SchemaFactory.createForClass(Asset);



