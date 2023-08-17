import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type SupplierDocument = HydratedDocument<Supplier>;

@Schema()
export class Supplier {
    @Prop()
    managerName: string; 
    @Prop({unique:true})
    managerCi: string
    @Prop()
    managerPhone: number
    @Prop()
    businessAddress: string; 
    @Prop({default:false})
    isDeleted: boolean
    @Prop({unique:true})
    email: string
    @Prop()
    businessName:string
    @Prop()
    NIT: string
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);



