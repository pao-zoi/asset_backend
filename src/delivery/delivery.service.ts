import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { Delivery, DeliveryDocument } from './schema/delivery.schema';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { AssetService } from 'src/asset/asset.service';
import { ActivoState, Asset, AssetDocument } from 'src/asset/schema/asset.schema';
import { CustomErrorService } from 'src/error.service';
import getConfig from '../config/configuration'
import { HttpService } from '@nestjs/axios';
import { DeliveryCertificate } from './delivery.certificate.service';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { FilterDeliveryDto } from './dto/filter.delivery.dto';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectModel(Delivery.name) private deliveryModel: Model<DeliveryDocument>,
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
    private customErrorService:CustomErrorService,
    private httpService:HttpService,
    private deliveryCertificate:DeliveryCertificate
  ){}

  async create(createDeliveryDto: CreateDeliveryDto) {
    const { assetId, personId, location } = createDeliveryDto

    const findAsset = await this.assetModel.findOne({_id:assetId})
    
    if(!findAsset){
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'no encotrado','no se encontro el activo solicitado')
    }
    let responsibleFound
    try {
      const res = await this.httpService.get(
        `${getConfig().api_personal}api/personal/${personId}`).toPromise();
      responsibleFound = res.data
    } catch (error) {
      throw new HttpException('persona no encontrada', HttpStatus.NOT_FOUND)
    }

//CAMBIAR EL METODO "RUTA"
    let locationData
    try {
      const res = await this.httpService.get(
        `${getConfig().api_organigrama}api/departments/${location}`).toPromise();
        locationData = res.data
    } catch (error) {
      throw new HttpException('departamento/unidad no encontrada', HttpStatus.NOT_FOUND)
    }


    const findPersonExists = await this.deliveryModel.findOne({isDeleted:false,personId:personId})

    if(findAsset.state != 'AVAILABLE'){
      this.customErrorService.customResponse(HttpStatus.CONFLICT, true, 'conflicto','el activo ya se encuentra asignado a un funcionario')
    }
    
    if(findPersonExists){
      findPersonExists.assetId.push(assetId)
      await findPersonExists.save()
      findAsset.state = ActivoState.in_use
      findAsset.save()

      const person = await this.deliveryModel.findOne({personId:personId}).populate('assetId').exec();
      createDeliveryDto.location=locationData.name
      const htmlContent = await this.deliveryCertificate.htmlContent(person, responsibleFound, createDeliveryDto,responsibleFound.charge)      
      createDeliveryDto.location=location

      try {
        const res = await this.httpService.put(`${getConfig().api_pdf}convert/${findPersonExists.pdf}`, {textPlain:htmlContent}).toPromise()
        findPersonExists.pdf = res.data._id
      } catch (error) {
        error.response?.data;	    
      }
      return findPersonExists.save()
    }

    const assetArray = [findAsset];
    
    createDeliveryDto.location=locationData.name
    
    const htmlContent = await this.deliveryCertificate.htmlContent(assetArray, responsibleFound, createDeliveryDto, responsibleFound.charge)

    createDeliveryDto.location=location
    try {
      const res = await this.httpService.post(`${getConfig().api_pdf}convert/`, {textPlain:htmlContent}).toPromise()
      createDeliveryDto.pdf = res.data._id
    } catch (error) {
      error.response?.data;	    
    }
    findAsset.state = ActivoState.in_use
    findAsset.save()
    return await this.deliveryModel.create(createDeliveryDto);
  }

  async findAll() {
    
      const deliveries = await this.deliveryModel.find().populate('assetId') 
      
      const count = await this.deliveryModel.estimatedDocumentCount();
      if (count < 0) {
        return deliveries;
      }   

    let data = {}
    const dataArray = [];
    for (const delivery of deliveries) {

      let assetArray = delivery.assetId;
      if (typeof assetArray === 'string') {
        assetArray = JSON.parse(assetArray);
      }

      const asset = await Promise.all(assetArray.map(async(asset: any) => {
        const name = asset.name
        let file 
        if(asset.file){
            try {

              const res = await this.httpService
                .get(`${getConfig().file_upload}file/${asset.file}`)
                .toPromise();
              file = res.data.file.base64
            } catch (error) {
              throw error.response?.data;
            }
        } 
        return {name, file: file ? file : ""}
      }));

      let person
      try {
        const res = await this.httpService.get(
          `${getConfig().api_personal}api/personal/${delivery.personId}`).toPromise();
        person = `${res.data.name} ${res.data.lastName}`
      } catch (error) {
        throw new HttpException('persona no encontrada', HttpStatus.NOT_FOUND)
      }
      const createdAt = delivery.createdAt
      const updateDate = delivery.updatedAt
      const dateDelivery = createdAt.toISOString().split("T")[0];
      const updateDateDelivery = updateDate.toISOString().split("T")[0];
      
      let proceedings
      if (delivery.pdf && delivery.pdf !='') {
        try {
          const res = await this.httpService.get(
            `${getConfig().api_pdf}convert/${delivery.pdf}`).toPromise();
            proceedings = res.data.pdfBase64
        } catch (error) {
          throw new HttpException('acta no encotrada', HttpStatus.NOT_FOUND)
        }
      }else{proceedings=''}
      data = {
        _id:delivery._id, 
        person,
        createdDate:dateDelivery,updateDate:updateDateDelivery,
        proceedings,
        asset
      }
      dataArray.push(data);
    }
    return dataArray;
  }

  async findOne(id: string) {
    const deliveries = await this.deliveryModel.findById(id).populate('assetId')

    if(!deliveries){
      throw new HttpException('entrega no encontrada', HttpStatus.NOT_FOUND)
    }
    if(deliveries.isDeleted == true){
      throw new HttpException('entrega eliminada', 400)
    }

    let data = {}

      let assetArray = deliveries.assetId;
      if (typeof assetArray === 'string') {
        assetArray = JSON.parse(assetArray);
      }

      const asset = await Promise.all(assetArray.map(async(asset: any) => {
        const _id = asset._id
        const name = asset.name
        let file
        if(asset.file){
            try {
            const res = await this.httpService
                .get(`${getConfig().file_upload}file/${asset.file}`)
                .toPromise();
              file = res.data.file.base64
            } catch (error) {
              throw error.response?.data;
            }
        } 
        return {_id,name, file: file ? file : ""}
      }));

      let person
      try {
        const res = await this.httpService.get(
          `${getConfig().api_personal}api/personal/${deliveries.personId}`).toPromise();
        person = `${res.data.name} ${res.data.lastName}`
      } catch (error) {
        throw new HttpException('persona no encontrada', HttpStatus.NOT_FOUND)
      }
      const createdAt = deliveries.createdAt
      const updateDate = deliveries.updatedAt
      const dateDelivery = createdAt.toISOString().split("T")[0];
      const updateDateDelivery = updateDate.toISOString().split("T")[0];
      
      let proceedings
      try {
        const res = await this.httpService.get(
          `${getConfig().api_pdf}convert/${deliveries.pdf}`).toPromise();
          proceedings = res.data.pdfBase64
      } catch (error) {
        throw new HttpException('acta no encotrada', HttpStatus.NOT_FOUND)
      }
      data = {...data, asset,person,createdDate:dateDelivery,updateDate:updateDateDelivery,proceedings}

    return [data];
  }



  async update(id: string, updateDeliveryDto: UpdateDeliveryDto) {
    const { assetIdNew, assetIdOld ,personId,location } = updateDeliveryDto
    
    const findDelivery = await this.deliveryModel.findById(id)
    if(!findDelivery){
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'entrega no encontrado','al entrega de activo que solicita no se puedo encontrar')
    }

    const findAssetOld = await this.assetModel.findOne({_id:assetIdOld})

    if(!findAssetOld){
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'activo no encontrado','el activo que solicita no se puedo encontrar')
    }

    if(!findDelivery.assetId.includes(assetIdOld)){
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'activo no encontrado',`el usurio no tiene a su cargo el activo que ingreso ${findAssetOld.name}`)
    }
    
    const findAssetNew = await this.assetModel.findOne({_id: assetIdNew})

    if(!findAssetNew){
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'activo no encontrado','el activo que solicita no se puedo encontrar')
    }

    if(findAssetNew.state != 'AVAILABLE'){
      this.customErrorService.customResponse(HttpStatus.CONFLICT, true, 'conflicto','el activo ya se encuentra en uso')
    }

    let person
    try {
      const res = await this.httpService.get(
        `${getConfig().api_personal}api/personal/${personId}`).toPromise();
      person = res.data
    } catch (error) {
      throw new HttpException('persona no encontrada', HttpStatus.NOT_FOUND)
    }

    let locationData
    try {
      const res = await this.httpService.get(
        `${getConfig().api_organigrama}main/${location}`).toPromise();
        locationData = res.data
    } catch (error) {
      throw new HttpException('persona no encontrada', HttpStatus.NOT_FOUND)
    }

    const index = findDelivery.assetId.findIndex(id => id.toString() === assetIdOld);

    if (index !== -1) {
      findDelivery.assetId[index] = assetIdNew;
    }

    findDelivery.personId = person._id
    findDelivery.location = location
    
    findAssetNew.state = ActivoState.in_use
    findAssetOld.state = ActivoState.available
    await findAssetNew.save()
    await findAssetOld.save()
    
    updateDeliveryDto.location = locationData.name
    const assets = await this.assetModel.find({ _id: { $in: findDelivery.assetId } });

    const htmlContent = await this.deliveryCertificate.htmlContent(assets,person, updateDeliveryDto,person.charge)

      try {
        const res = await this.httpService.put(`${getConfig().api_pdf}convert/${findDelivery.pdf}`, {textPlain:htmlContent}).toPromise()
        findDelivery.pdf = res.data._id
      } catch (error) {
        error.response?.data;	    
      }
    return await findDelivery.save()
  }

  async darDeBaja(_id: string) { 
    const deliveries = await this.deliveryModel.findOne({ _id });
    if (!deliveries) {
      throw new HttpException('entrega no encontrado', 404);
    }

    try {
      await this.httpService.delete(`${getConfig().api_pdf}convert/${deliveries.pdf}`).toPromise()
      deliveries.pdf='' //en caso de reetabñecer eliminar este apartado
    } catch (error) {
      throw error.response?.data;
    }
  
    const assets = await this.assetModel.find({ _id: { $in: deliveries.assetId } });
    
    for(const asset of assets){
      asset.state = ActivoState.available
      asset.save()
      deliveries.assetId.pop()
    }
    deliveries.isDeleted = true;
    return deliveries.save();
  }

//para que pueda listar los nuevos activos
  async editDelivery(){
    try {
      const editDeliveries = await this.assetModel.find({isDeleted:false, state:'AVAILABLE'});

      const data = [];
      for (const asset of editDeliveries) {
        data.push({_id:asset._id,name:asset.name}); 
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

}
