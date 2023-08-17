import { HttpException, Injectable } from '@nestjs/common';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Supplier, SupplierDocument } from './schema/supplier.schema';
import { Model } from 'mongoose';
import getConfig from '../config/configuration'
import { Asset, AssetDocument } from 'src/asset/schema/asset.schema';

@Injectable()
export class SupplierService {
  constructor(    
    @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>,  
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,  
    ){}

    async create(createSupplierDto: CreateSupplierDto) {
      return await this.supplierModel.create(createSupplierDto);
    }

  async findAll() {
    return await this.supplierModel.find({isDeleted:false}
      );
  }

  async findOne(id: string) {
    const findSupplier = await this.supplierModel.findOne({_id:id})
    if(!findSupplier){
      throw new HttpException('no se encontro al proveedor',404)
    }
    return await this.supplierModel.findById(id)
  }

  async update(id: string, updateSupplierDto) {
    const findSupplier = await this.supplierModel.findOne({_id:id})
    if(!findSupplier){
      throw new HttpException('no se encontro al proveedor',404)
    }
    return await this.supplierModel.findByIdAndUpdate(id,updateSupplierDto,{new:true});
  }

  async remove(id: string) {
    const findSupplier = await this.supplierModel.findOne({_id:id})
    if(!findSupplier){
      throw new HttpException('no se encontro al proveedor',404)
    }
    findSupplier.isDeleted= true
    return findSupplier.save();
  }

  async restartsupplier(id:string){
    const restartSupplier = await this.supplierModel.findOne({ _id: id })
    if (!restartSupplier) {
      throw new HttpException('la aplicacion no existe',404)
    }
    if (restartSupplier.isDeleted==false) {
      throw new HttpException('el proveedor no esta eliminado',409)
    }
    restartSupplier.isDeleted = false 
    return restartSupplier.save()
  }
}
