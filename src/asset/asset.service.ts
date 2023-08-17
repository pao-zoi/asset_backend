import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateAssetDto } from './dto/create-asset.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Asset, AssetDocument } from './schema/asset.schema';
import { Model } from 'mongoose';
import {
  DepreciationAssetList,
  DepreciationAssetListDocument,
} from 'src/depreciation-asset-list/schema/depreciation-asset';
import { HttpService } from '@nestjs/axios';
import getConfig from '../config/configuration';
import { DepreciationService } from './depreciation.service';
import { Supplier, SupplierDocument,
} from 'src/supplier/schema/supplier.schema';
import { Ufv, UfvDocument } from '../get-ufv/schema/ufvs.schema';
import { GetUfvService } from 'src/get-ufv/get-ufv.service';
import { CustomErrorService } from 'src/error.service';
import { DocumentPdf } from './asset.documentPdf.service';
import { FilterAssetDto } from './dto/filter.asset.dto';
import { FilterQuery } from "mongoose";

@Injectable()
export class AssetService {
  constructor(
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
    @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>,
    @InjectModel(DepreciationAssetList.name) private depreciationAssetListModel: Model<DepreciationAssetListDocument>,
    @InjectModel(Ufv.name) private ufvmodel: Model<UfvDocument>,
    private httpService: HttpService,
    private depreciationService:DepreciationService,
    private ufvService:GetUfvService,
    private customErrorService:CustomErrorService,
    private documentPdf: DocumentPdf
  ) {}



  async create(objectAsset: CreateAssetDto) {
    const { supplier, responsible, location,file, informationCountable,  } = objectAsset;
    const { price, dateAcquisition } = informationCountable
    
    let responsibleFound
    try {
      const res = await this.httpService.get(
        `${getConfig().api_personal}api/personal/${responsible}`).toPromise();
      responsibleFound = res.data
    } catch (error) {
      throw new HttpException('persona no encontrada', HttpStatus.NOT_FOUND)
    }
    
    const findSupplier = await this.supplierModel.findOne({ _id: supplier });
    if (!findSupplier) {
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'proveedor no encontrado','no se encontro al proveedor que intento registrar')
    }

    objectAsset.supplier = findSupplier._id.toString();
    
    const depresiationInitial = await this.calculateDepreciationInitial(objectAsset);
    
    let assetDepresiation = await this.depreciationService.calculateAndStoreDepreciation(depresiationInitial);
    const findUfv = await this.ufvmodel.findOne( { fecha:dateAcquisition })
    if(!findUfv){
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'ufv no encontrada','no se puedo encontrar la ufv para la fecha ingresada')
    }
    
    const ufvCurrent = await this.ufvService.ExtractUfvCurrent()
    assetDepresiation.ufv3 = (price*(ufvCurrent/findUfv.ufv)-price).toFixed(2)
    assetDepresiation.ufv4 = ((price*(ufvCurrent/findUfv.ufv)-price)+price).toFixed(2)

    assetDepresiation.informationCountable.code =await this.generateUniqueCode(objectAsset)


    if(file  && file != '' && file!= 'string'){
      const mimeType = file.split(';')[0].split(':')[1].split('/')[1];
      const base64 = file.split(',')[1];
      const fileObj = {
        mime: mimeType,
        base64: base64
      };

      try {
        const res = await this.httpService.post(`${getConfig().file_upload}files/upload`, { file:fileObj }).toPromise()
    
        assetDepresiation = {...assetDepresiation ,file:res.data.file._id }
      } catch (error) {
        throw error.response?.data
      }
    }

    const htmlContent = await this.documentPdf.htmlContent(assetDepresiation, responsibleFound, findSupplier)

    try {
      
      const res = await this.httpService.post(`${getConfig().api_pdf}convert`, {textPlain:htmlContent}).toPromise()
      assetDepresiation.informationCountable.documentPdf = res.data._id
    } catch (error) {
      throw error.response?.data;	    
    }
    
    const newAsset = await new this.assetModel(assetDepresiation);

    return newAsset.save()
  }

//------------
async generateUniqueCode(objectAsset: CreateAssetDto) {
  const AssetLote = objectAsset.informationCountable.lote;
  if (AssetLote >= 1) {
    const year = new Date().getFullYear();
    const lastAssetOfYear = await this.assetModel.findOne().sort({ _id: -1 }).lean().exec();
   
    let count = 1;
    if (lastAssetOfYear) {
      const lastCodeArray = (lastAssetOfYear.informationCountable.code as unknown) as string[];
      const lastCode = lastCodeArray[lastCodeArray.length - 1]; // Obtiene la última cadena del array
      const lastCodeParts = lastCode.split('_');
      if (parseInt(lastCodeParts[1]) != year) {
        count = 1;
      } else {
        count = parseInt(lastCodeParts[2].substring(1)) + 1;
      }
    }

    const codes = [];
    for (let i = 0; i < AssetLote; i++) {
      const code = `INV_${year}_A${count}`;
      codes.push(code);
      count++;
    }
    return codes;
  } else {
    throw new HttpException('No se creó el activo debido a que el valor del campo "lote" no es mayor o igual a 1.', HttpStatus.NOT_FOUND);
  }
}

//----------------


  async findAll(params?:FilterAssetDto) {
    const filters: FilterQuery<Asset> = { isDeleted: false };
    const { limit, offset, nameAsset, state } = params;
      if (params) {
        if (nameAsset) {
          filters.name = {
            $regex: nameAsset,
            $options: "i",
          };
        }
        if (state) {
          filters.state = {
            $regex: state,
            $options: "i",
          };
        }
      }
      const [assets] = await Promise.all([
        this.assetModel
          .find(filters)
          .limit(limit)
          .skip(offset || 0 * limit || 0)
          .populate('supplier')
          .populate('typeCategoryAsset')
          .exec(),
      ]);         

    const count = await this.assetModel.estimatedDocumentCount();

    if (count < 0) {
      return assets;
    }
    for (const asset of assets) {
    
      if (asset.file && asset.file != ' ') {
        try {
          const res = await this.httpService.get(`${getConfig().file_upload}file/${asset.file}`).toPromise();
          asset.file = res.data.file.base64;
        } catch (error) {
          throw error.response?.data;
        }
      }
      try {
        const res = await this.httpService
          .get(`${getConfig().api_personal}api/personal/${asset.responsible}`)
          .toPromise();
        const responsibleData = res.data;
        asset.responsible = responsibleData;
      } catch (error) {
        throw error.response?.data;
      }

      try {
      if(asset.informationCountable.documentPdf){
        const responsePdf = await this.httpService.get(`${getConfig().api_pdf}convert/${asset.informationCountable.documentPdf}`).toPromise()
          asset.informationCountable.documentPdf = responsePdf.data.pdfBase64
        }  
      } catch (error) {
        throw error.response?.data;
      }
    }

    return assets

  }

  async findOne(id: string) {
    const asset = await this.assetModel.findById(id).populate('typeCategoryAsset').populate('supplier');

    
    if (!asset) {
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'activo no encontrado','el activo que solicita no se puedo encontrar')
    }
    
    if (asset.file) {
      try {
        const res = await this.httpService
          .get(`${getConfig().file_upload}file/${asset.file}`)
          .toPromise();
        asset.file = res.data.file.base64;
        
      } catch (error) {
        throw error.response?.data;
      }
    }

    if(asset.responsible){
      try {
        const res = await this.httpService
          .get(`${getConfig().api_personal}api/personal/${asset.responsible}`)
          .toPromise();
        const responsibleData = res.data;
        asset.responsible = responsibleData;
      } catch (error) {
        throw error.response?.data;
      }
    }

    if(asset.informationCountable.documentPdf){
      try {
        const responsePdf = await this.httpService.get(`${getConfig().api_pdf}convert/${asset.informationCountable.documentPdf}`).toPromise()
        asset.informationCountable.documentPdf = responsePdf.data.pdfBase64
      } catch (error) {
        throw error.response?.data;
      }
    }
    return asset;
  }


  async update(id: string, updateAssetDto) {
    
    const findAsset = await this.assetModel.findById(id);
    
    if (!findAsset) {
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'activo no encontrado','el activo que solicita no se puedo encontrar')
    }

    const { responsible } = updateAssetDto
    const { dateAcquisition, price } = updateAssetDto.informationCountable

    
    const { file } = updateAssetDto;

    if (file && file.startsWith('data')) {
      const mimeType = file.split(';')[0].split(':')[1].split('/')[1];
      const base64 = file.split(',')[1];
      const fileObj = {
        mime: mimeType,
        base64: base64,
      };
      if (findAsset.file) {
        try {
          const res = await this.httpService
            .post(`${getConfig().file_upload}file/update/${findAsset.file}`, {
              file: fileObj,
            })
            .toPromise();
            
          // updateAssetDto = { ...updateAssetDto, file: res.data.file._id };
          updateAssetDto = { ...updateAssetDto, file: res.data.updatedFile._id };

        } catch (error) {
          throw error.response?.data;
        }
      } else {
        try {
          const res = await this.httpService
            .post(`${getConfig().file_upload}files/upload`, { file: fileObj })
            .toPromise();
          updateAssetDto = { ...updateAssetDto, file: res.data.file._id };
        } catch (error) {
          throw error.response?.data;
        }
      }
    } else {
      updateAssetDto.file = findAsset.file;
    }
    let responsibleFound
    try {
      const res = await this.httpService.get(
        `${getConfig().api_personal}api/personal/${responsible}`).toPromise();
        responsibleFound=res.data
    } catch (error) {
      throw new HttpException('persona no encontrada',404)
    }

    
    const depresiationInitial = await this.calculateDepreciationInitial(updateAssetDto);
    const assetDepresiation = await this.depreciationService.calculateAndStoreDepreciation(
      depresiationInitial);

    const findUfv = await this.ufvmodel.findOne({fecha:dateAcquisition})

    if(!findUfv){
      throw new HttpException('ufv no encotrada para la fecha solicitada',404)
    }
   
    const ufvCurrent = await this.ufvService.ExtractUfvCurrent()
    assetDepresiation.ufv3 = (price*(ufvCurrent/findUfv.ufv)-price).toFixed(2)
    assetDepresiation.ufv4 = ((price*(ufvCurrent/findUfv.ufv)-price)+price).toFixed(2)
  
    assetDepresiation.informationCountable.code = findAsset.informationCountable.code
    
    const findSupplier = await this.supplierModel.findOne({_id:findAsset.supplier})
    
    if(!findSupplier){
      throw new HttpException('proveedor no encotrado',404)
    }

    const htmlContent = await this.documentPdf.htmlContent(updateAssetDto, responsibleFound, findSupplier)
    
    try {
      const res = await this.httpService.put(`${getConfig().api_pdf}convert/${findAsset.informationCountable.documentPdf}`, { textPlain: htmlContent }).toPromise()
      assetDepresiation.informationCountable.documentPdf = res.data._id
    } catch (error) {
      throw error.response?.data;	    
    }


    return await this.assetModel.findByIdAndUpdate(id, assetDepresiation, { new: true });
  }

  async darDeBaja(_id: string) { 
    const asset = await this.assetModel.findOne({ _id });
    if (!asset) {
      throw new HttpException('activo no encontrado', 404);
    }
    if (asset.file) {
      try {
        await this.httpService
          .delete(`${getConfig().file_upload}file/${asset.file}`)
          .toPromise();
      } catch (error) {
        throw error.response?.data;
      }
    } 
    try {
      await this.httpService.delete(`${getConfig().api_pdf}convert/${asset.informationCountable.documentPdf}`).toPromise()
    } catch (error) {

      throw error.response?.data;
    }

    asset.isDeleted = true;
    return asset.save();
  }

  async updateEstado(activoId: string, estado: string): Promise<void> {
    await this.assetModel.findOneAndUpdate({ _id: activoId }, { estado });
  }

  async calculateDepreciationInitial(objectAsset) {
    const life = await this.depreciationAssetListModel.findOne({
      assetCategory: objectAsset.typeCategoryAsset,
    });
    if (!life) {
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'grupo contable no encontrado',`el grupo contable ${objectAsset.typeCategoryAsset} no existe` )
    }
    objectAsset.typeCategoryAsset = life._id.toString();
    let depreciatedForYear = objectAsset.informationCountable.price / life.usefulLife;
    let depreciationPerDay = depreciatedForYear / 360;
   
    objectAsset.depreciatedValue = depreciationPerDay;
    return objectAsset;
  }  

}
