import { HttpException, HttpStatus, Injectable, Redirect } from '@nestjs/common';
import { CreateDevolutionDto } from './dto/create-devolution.dto';
import { UpdateDevolutionDto } from './dto/update-devolution.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Devolution, DevolutionDocument } from './schema/devolution.schema';
import { Model } from 'mongoose';
import { Delivery, DeliveryDocument } from 'src/delivery/schema/delivery.schema';
import { ActivoState, Asset, AssetDocument } from 'src/asset/schema/asset.schema';
import { CustomErrorService } from 'src/error.service';
import { HttpService } from '@nestjs/axios';
import getConfig from '../config/configuration'
import { DevolutionCertificate } from './devolution.certificate.service';

@Injectable()
export class DevolutionService {

  constructor(
    @InjectModel(Devolution.name) private devolutionModel: Model<DevolutionDocument>,
    @InjectModel(Delivery.name) private deliveryModel: Model<DeliveryDocument>,
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
    private customErrorService: CustomErrorService,
    private httpService: HttpService,
    private devolutionCertificate:DevolutionCertificate
  ){}

  async create(createDevolutionDto: CreateDevolutionDto) {
    const { assetId, personId, location ,idUser } = createDevolutionDto
    
    const findAsset = await this.assetModel.findOne({isDeleted:false,state:'IN_USE',_id:assetId})

    if(!findAsset){
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'no encotrado','no se encontro el activo solicitado o no esta en uso')
    }
    let responsibleFound
    try {
      const res = await this.httpService.get(
        `${getConfig().api_personal}api/personal/${personId}`).toPromise();
      responsibleFound = res.data
    } catch (error) {
      throw error.response?.data
    }
    
    let locationData
    try {
      const res = await this.httpService.get(
        `${getConfig().api_organigrama}main/${location}`).toPromise();
        locationData = res.data
    } catch (error) {
      throw new HttpException('departamento/unidad no encontrada', HttpStatus.NOT_FOUND)
    }

    const findDeliveryPerson = await this.deliveryModel.findOne({isDeleted:false ,personId})

    if(!findDeliveryPerson){
      this.customErrorService.customResponse(HttpStatus.CONFLICT, true, 'conflicto','no se le entrego ningun activo a la persona solicitada')
    }

    if(findDeliveryPerson.assetId.includes(assetId)){
      if(findDeliveryPerson.location != location){
        this.customErrorService.customResponse(HttpStatus.CONFLICT, true, 'conflicto','la ubicacion del activo ingresado no corresponde al que se envio')
      }

      const ids = findDeliveryPerson.assetId.filter(id => id.toString() !== assetId,toString());
      
      while (findDeliveryPerson.assetId.length > 0) {
        findDeliveryPerson.assetId.splice(0, 1);
      }
      for(const id of ids){
         findDeliveryPerson.assetId.push(id.toString()) 
      }
      
      await findDeliveryPerson.save()      
      findAsset.state = ActivoState.available
      await findAsset.save()

      const findDevolutionPerson = await this.devolutionModel.findOne({isDeleted:false, personId:personId})
      
      if(findDevolutionPerson){
        findDevolutionPerson.assetId.push(assetId)

        findDevolutionPerson.location = location

        createDevolutionDto.location=locationData.name

        const htmlContent = await this.devolutionCertificate.htmlContent(await findDevolutionPerson.populate('assetId'), responsibleFound, createDevolutionDto,responsibleFound.charge)
        
        findDevolutionPerson.depopulate()

        try {
          const res = await this.httpService.put(`${getConfig().api_pdf}convert/${findDevolutionPerson.pdf}`, {textPlain:htmlContent}).toPromise()
          findDevolutionPerson.pdf = res.data._id
        } catch (error) {
          error.response?.data;	    
        }
        
        return findDevolutionPerson//.save()
      }


      createDevolutionDto.location=locationData.name
      let newDevolution = await new this.deliveryModel(createDevolutionDto).populate('assetId')
      
      const htmlContent = await this.devolutionCertificate.      htmlContent(newDevolution, responsibleFound, createDevolutionDto,responsibleFound.charge)
      try {
        //-------------------------------------------------
        const res = await this.httpService.post(`${getConfig().api_pdf}convert/`, {textPlain:htmlContent}).toPromise()
        newDevolution.pdf = res.data._id
      } catch (error) {
        error.response?.data;	    
      }

      newDevolution = await newDevolution.depopulate('assetId')

      newDevolution = await this.devolutionModel.create({
        assetId:newDevolution.assetId,
        responsibleId:idUser,
        personId:newDevolution.personId,
        pdf:newDevolution.pdf,
        location:location,
      })
      return newDevolution
    }
    this.customErrorService.customResponse(HttpStatus.CONFLICT, true, 'conflicto','no se le asigno al activo a dicho usuario') 
  
}
async findAll() {
  
  const devolutions = await this.devolutionModel.find({isDeleted:false}).populate('assetId')
    
  const count = await this.deliveryModel.estimatedDocumentCount();
    
  if (count < 0) {
    return [];
  }   

  let data = {}
  const dataArray = [];
  for (const devolution of devolutions) {
    let assetArray = devolution.assetId;
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
      return {name:name, file: file ? file : ""}
    }));

    let person
    try {
      const res = await this.httpService.get(
        `${getConfig().api_personal}api/personal/${devolution.personId}`).toPromise();
      person = `${res.data.name} ${res.data.lastName}`
    } catch (error) {
      throw new HttpException('persona no encontrada', HttpStatus.NOT_FOUND)
    }
    const createdAt = devolution.createdAt
    const updateDate = devolution.updatedAt
    const dateDelivery = createdAt.toISOString().split("T")[0];
    const updateDateDelivery = updateDate.toISOString().split("T")[0];
    
    let proceedings
    if (devolution.pdf && devolution.pdf !='') {
      try {
        const res = await this.httpService.get(
          `${getConfig().api_pdf}convert/${devolution.pdf}`).toPromise();
          proceedings = res.data.pdfBase64
      } catch (error) {
        throw new HttpException('acta de devolucion no encotrada', HttpStatus.NOT_FOUND)
      }
    }else{proceedings=''}
    
    let responsible
    try {
      const res = await this.httpService.get(
        `${getConfig().api_personal}api/personal/${devolution.responsibleId}`).toPromise();
        responsible = `${res.data.name} ${res.data.lastName}`
    } catch (error) {
      throw new HttpException('persona no encontrada', HttpStatus.NOT_FOUND)
    }
    
    data = {
      _id:devolution._id, 
      person,
      responsible,
      createdDate:dateDelivery,updateDate:updateDateDelivery,
      proceedings,
      asset
    }
    dataArray.push(data);
  }
  return dataArray;
}


async findOne(id: string) {
  const devolution = await this.devolutionModel.findOne({isDeleted:false, _id:id}).populate('assetId')

  if(!devolution){
    throw new HttpException('devolucion no encontrada', HttpStatus.NOT_FOUND)
  }

  let data = {}

    let assetArray = devolution.assetId;
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
        `${getConfig().api_personal}api/personal/${devolution.personId}`).toPromise();
      person = `${res.data.name} ${res.data.lastName}`
    } catch (error) {
      throw new HttpException('persona no encontrada', HttpStatus.NOT_FOUND)
    }
    const createdAt = devolution.createdAt
    const updateDate = devolution.updatedAt
    const dateDelivery = createdAt.toISOString().split("T")[0];
    const updateDateDelivery = updateDate.toISOString().split("T")[0];
    
    let proceedings
    try {
      const res = await this.httpService.get(
        `${getConfig().api_pdf}convert/${devolution.pdf}`).toPromise();
        proceedings = res.data.pdfBase64
    } catch (error) {
      throw new HttpException('acta no encotrada', HttpStatus.NOT_FOUND)
    }
    let responsible
    try {
      const res = await this.httpService.get(
        `${getConfig().api_personal}api/personal/${devolution.personId}`).toPromise();
        responsible = `${res.data.name} ${res.data.lastName}`
    } catch (error) {
      throw new HttpException('persona no encontrada', HttpStatus.NOT_FOUND)
    }
    data = {
      person,
      responsible,
      createdDate:dateDelivery,updateDate:updateDateDelivery,
      proceedings,
      asset
    }
  
  return [data];
}




async update(id: string, updateDeliveryDto: UpdateDevolutionDto) {
  const { assetIdNew, assetIdOld ,personId,location } = updateDeliveryDto
  
  const findDevolution = await this.devolutionModel.findById(id)

  if(!findDevolution){
    this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'devolucion no encontrada','no se encontro registro de devolucion para el activo que solicita')
  }
  
  const findPersonDelivery = await this.deliveryModel.findOne({isDeleted:false,personId:findDevolution.personId})

  if(!findPersonDelivery){
    this.customErrorService.customResponse(HttpStatus.BAD_REQUEST, true, 'mala peticion','el usuario no tiene actas creadas  de entrega de activos')
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
      throw new HttpException('departamento/unidad no encontrada', HttpStatus.NOT_FOUND)
    }
  
  if(findDevolution.assetId.includes(assetIdOld)){
    if(findPersonDelivery.assetId.includes(assetIdNew)){
    
      const indexDevolution = findDevolution.assetId.indexOf(assetIdOld);
      if (indexDevolution !== -1) {
        findDevolution.assetId.splice(indexDevolution, 1, assetIdNew);
      }

      const indexDelivery = findPersonDelivery.assetId.indexOf(assetIdNew);
  
      if (indexDelivery !== -1) {
        findPersonDelivery.assetId.splice(indexDelivery, 1, assetIdOld);
      }      
      updateDeliveryDto.location=locationData.name

      const htmlContent = await this.devolutionCertificate.htmlContent(await findDevolution.populate('assetId'), person, updateDeliveryDto,person.charge)
        
      updateDeliveryDto.location=location
      findDevolution.depopulate()
      
      try {
        const res = await this.httpService.put(`${getConfig().api_pdf}convert/${findDevolution.pdf}`, {textPlain:htmlContent}).toPromise()
        findDevolution.pdf = res.data._id
      } catch (error) {
        error.response?.data;	    
      }
      await findPersonDelivery.save();
      findDevolution.location=location;
      await findDevolution.save();

      return findDevolution
    }else{
      this.customErrorService.customResponse(HttpStatus.BAD_REQUEST, true, 'mala peticion','el activo ingresado no se encuentra en las actas de entrega del usuario')
    }
  }else{
    this.customErrorService.customResponse(HttpStatus.BAD_REQUEST, true, 'mala peticion','el activo ingresado no se encuentra en la devolucion solicitada')  
  }
  
return
}



  async remove(_id: string) { 
    const devolution = await this.devolutionModel.findOne({ _id });
    if (!devolution) {
      throw new HttpException('entrega no encontrado', 404);
    }

    try {
      await this.httpService.delete(`${getConfig().api_pdf}convert/${devolution.pdf}`).toPromise()
      devolution.pdf=''
    } catch (error) {
      throw error.response?.data;
    }
  
    const assets = await this.assetModel.find({ _id: { $in: devolution.assetId } });
    
    for(const asset of assets){
      devolution.assetId.pop()
    }
    devolution.isDeleted = true;
    return devolution.save();
  }
}
