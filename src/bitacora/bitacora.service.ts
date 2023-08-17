import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Bitacora, BitacoraDocument } from './schema/bitacora.schema';
import { Model } from 'mongoose';

@Injectable()
export class BitacoraService {
  constructor(
    @InjectModel(Bitacora.name) private readonly bitacoraModel: Model<BitacoraDocument>,
  ){}
  async getAllBitacora(){
    return await this.bitacoraModel.find().sort({ createdAt: -1 }); 

  }
}
