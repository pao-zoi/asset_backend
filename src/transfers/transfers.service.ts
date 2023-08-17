import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Transfers, TransfersDocument } from './schema/transfers.schema';
import { Asset, AssetDocument } from 'src/asset/schema/asset.schema';
import { CustomErrorService } from 'src/error.service';
import { Model } from 'mongoose';
import { Delivery, DeliveryDocument } from 'src/delivery/schema/delivery.schema';
import getConfig from '../config/configuration'
import { DeliveryCertificate } from 'src/delivery/delivery.certificate.service';
import { HttpService } from '@nestjs/axios';
import { TransferCertificate } from './transfers.certificate.service';

@Injectable()
export class TransfersService {
  constructor(
    @InjectModel(Transfers.name) private transfersModel: Model<TransfersDocument>,
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
    @InjectModel(Delivery.name) private deliveryModel: Model<DeliveryDocument>,
    private customErrorService:CustomErrorService,
    private deliveryCertificate:DeliveryCertificate,
    private httpService:HttpService,
    private transferCertificate:TransferCertificate
    ){}


  async create(createTransferDto: CreateTransferDto) {
    const { assetId, intruded, origin, destination, personalNew, previousPersonal, reason } = createTransferDto
    
    const findAsset = await this.assetModel.findOne({state:'IN_USE',_id:assetId})
    
    if(!findAsset){
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'no encotrado','no se encontro el activo solicitado o no esta en uso')
    }
  
    let intrudedPerson;
    try {
      intrudedPerson = await this.fetchData(`${getConfig().api_personal}api/personal/${intruded}`);
    } catch (error) {
      throw error;
    }

    if(!intrudedPerson){
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'no encotrado','no se encontro a la persona que autorizo la orden')
    }

    let originAsset
    try {
      originAsset = await this.fetchData(`${getConfig().api_organigrama}api/departments/${origin}`);
    } catch (error) {
      throw error;
    }

    if(!originAsset){
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'no encotrado','no se encontro el origen del activo')
    }

    let destinationAsset
    try {
      destinationAsset = await this.fetchData(`${getConfig().api_organigrama}api/departments/${destination}`);
    } catch (error) {
      throw error;
    }

    if(!destinationAsset){
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'no encotrado','no se encontro el destino del activo')
    }

    let personNew
    try {
      personNew = await this.fetchData(`${getConfig().api_personal}api/personal/${personalNew}`);
    } catch (error) {
      throw error;
    }

    if(!personNew){
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'no encotrado','no se encontro al nuevo encargado del activo')
    }

    let previousPerson
    try {
      previousPerson = await this.fetchData(`${getConfig().api_personal}api/personal/${previousPersonal}`);
    } catch (error) {
      throw error;
    }

    if(!previousPerson){
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'no encotrado','no se encontro al anterior encargado del activo')
    }

  
    const findPrevious = await this.deliveryModel.findOne({personId:previousPersonal, isDeleted:false})

      if(!findPrevious){
        this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'no encotrado','la persona actual no se encuentrada registrada para poder transferir activos')
      }

      

      if(!findPrevious.assetId.includes(assetId)){
        this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'no encotrado','la persona actual no tiene el activo asignado')
      }

    const findPersonDelivery = await this.deliveryModel.findOne({personId:personalNew, isDeleted:false})

    if(!findPersonDelivery){
      const index = findPrevious.assetId.indexOf(assetId);
      if (index !== -1) {
        findPrevious.assetId.splice(index, 1);
      }

      createTransferDto.location = destinationAsset.name
      
      const htmlContent = await this.deliveryCertificate.htmlContent([findAsset], personNew, createTransferDto, personNew.charge)

      const personDelivery = await new this.deliveryModel({
        assetId:assetId,
        personId:personalNew,
        pdf:'',
        location:destination
      }) 

      try {
        const res = await this.httpService.post(`${getConfig().api_pdf}convert/`, {textPlain:htmlContent}).toPromise()

        personDelivery.pdf = res.data._id
      } catch (error) {
        console.log(error)
        throw error.response?.data;	    
      }

      
      const newTransfer = await new this.transfersModel({
        asset:{
          assetId,
          date: new Date(Date.now() - 4 * 60 * 60 * 1000)
        },
        intruded,
        origin,
        destination,
        personalNew,
        previousPersonal,
        reason,
        pdf:''
      }).save()

      const populatedTransfer = await this.transfersModel.findById(newTransfer._id).populate('asset.assetId').exec();

      const htmlContentTransfer = await this.transferCertificate.htmlContent(personNew,previousPerson,intrudedPerson,populatedTransfer,destinationAsset)


      try {
        const res = await this.httpService.post(`${getConfig().api_pdf}convert/`, {textPlain:htmlContentTransfer}).toPromise()
        populatedTransfer.pdf = res.data._id
      } catch (error) {
        throw error.response?.data;	    
      }
      await populatedTransfer.depopulate()

      populatedTransfer.save()
      await findPrevious.save();
      await personDelivery.save()
      return populatedTransfer
    }

    const findTransfer = await this.transfersModel.findOne({personalNew:findPersonDelivery.personId})

    if(findTransfer){

      const index = findPrevious.assetId.indexOf(assetId);
      if (index !== -1) {
        findPrevious.assetId.splice(index, 1);
      }
      createTransferDto.location = destinationAsset.name

      findPersonDelivery.assetId.push(assetId)

      findTransfer.asset.push({
        assetId,
        date: new Date(Date.now() - 4 * 60 * 60 * 1000)
      })

      findTransfer.intruded=intruded
      findTransfer.origin=origin
      findTransfer.destination=destination
      findTransfer.personalNew=personalNew
      findTransfer.previousPersonal=previousPersonal
      findTransfer.reason=reason
     
      await findTransfer.populate('asset.assetId');

      const htmlContentTransfer = await this.transferCertificate.htmlContent(personNew,previousPerson,intrudedPerson,findTransfer,destinationAsset)
      try {
        const res = await this.httpService.put(`${getConfig().api_pdf}convert/${findTransfer.pdf}`, {textPlain:htmlContentTransfer}).toPromise()

        findTransfer.pdf = res.data._id
      } catch (error) {
        throw error.response?.data;	    
      }
      await findTransfer.depopulate('asset.assetId');
      await findPrevious.save()
      await findPersonDelivery.save()
      return await findTransfer.save()
    }

    const index = findPrevious.assetId.indexOf(assetId);
      if (index !== -1) {
        findPrevious.assetId.splice(index, 1);
      }

      findPersonDelivery.assetId.push(assetId)
            
      const newTransfer = await new this.transfersModel({
        asset:{
          assetId,
          date: new Date(Date.now() - 4 * 60 * 60 * 1000),
          reason
        },
        intruded,
        origin,
        destination,
        personalNew,
        previousPersonal,
        reason,
        pdf:''
      }).save()

      const populatedTransfer = await this.transfersModel.findById(newTransfer._id).populate('asset.assetId').exec();

      const htmlContentTransfer = await this.transferCertificate.htmlContent(personNew,previousPerson,intrudedPerson,populatedTransfer,destinationAsset)


      try {
        const res = await this.httpService.post(`${getConfig().api_pdf}convert/`, {textPlain:htmlContentTransfer}).toPromise()
        populatedTransfer.pdf = res.data._id
      } catch (error) {
        throw error.response?.data;	    
      }
      await populatedTransfer.depopulate()

      await  populatedTransfer.save()
      await findPrevious.save();
      await findPersonDelivery.save()
      return populatedTransfer
  }

  async findAll() {
     const transfers = await this.transfersModel.find({isDeleted:false}).populate('asset.assetId') ;
     if(transfers.length==0){
      return transfers
     }
     const data=[]
     for(const transfer of transfers){
      
      try {
        transfer.intruded = await this.fetchData(`${getConfig().api_personal}api/personal/${transfer.intruded}`);

        transfer.origin = await this.fetchData(`${getConfig().api_organigrama}api/departments/${transfer.origin}`);

        transfer.destination = await this.fetchData(`${getConfig().api_organigrama}api/departments/${transfer.destination}`);

        transfer.personalNew = await this.fetchData(`${getConfig().api_personal}api/personal/${transfer.personalNew}`);

        transfer.previousPersonal = await this.fetchData(`${getConfig().api_personal}api/personal/${transfer.previousPersonal}`);

        transfer.pdf = await this.fetchData(`${getConfig().api_pdf}convert/${transfer.pdf}`);
        data.push(transfer)

      } catch (error) {
        throw error
      }
     }
     
     return data
  }

  async findOne(_id: string) {
    const transfer = await this.transfersModel.findOne({_id,isDeleted:false}).populate('asset.assetId') ;
    
    if(!transfer){
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'no encotrado','no se encontro la transferencia que solicita')
    }

      try {
        transfer.intruded = await this.fetchData(`${getConfig().api_personal}api/personal/${transfer.intruded}`);

        transfer.origin = await this.fetchData(`${getConfig().api_organigrama}api/departments/${transfer.origin}`);

        transfer.destination = await this.fetchData(`${getConfig().api_organigrama}api/departments/${transfer.destination}`);

        transfer.personalNew = await this.fetchData(`${getConfig().api_personal}api/personal/${transfer.personalNew}`);

        transfer.previousPersonal = await this.fetchData(`${getConfig().api_personal}api/personal/${transfer.previousPersonal}`);

        transfer.pdf = await this.fetchData(`${getConfig().api_pdf}convert/${transfer.pdf}`);
        
      } catch (error) {
        throw error
      }
     
     
     return transfer
  }






  
  async update(id: string, updateTransferDto: UpdateTransferDto) {
    const { intruded, origin, destination, reason, idUser } = updateTransferDto
    // const newTransfer = { intruded, origin, destination, reason }

    const findTransfer = await this.transfersModel.findById(id).populate('asset.assetId')
    if(!findTransfer){
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'no encotrado','no se encontro la transferencia que solicita')
    }

    let intrudedData
    try {
      intrudedData = await this.fetchData(`${getConfig().api_personal}api/personal/${intruded}`);
    } catch (error) {
      throw error
    }
    

    let destinationAsset
    try {
      destinationAsset = await this.fetchData(`${getConfig().api_organigrama}api/departments/${destination}`);
    } catch (error) {
      throw error
    }

    let personNew
    try {
      personNew = await this.fetchData(`${getConfig().api_personal}api/personal/${findTransfer.personalNew}`);
    } catch (error) {
      throw error
    }

    let previousPerson
    try {
      previousPerson = await this.fetchData(`${getConfig().api_personal}api/personal/${findTransfer.previousPersonal}`);
    } catch (error) {
      throw error
    }
    
    const htmlContentTransfer = await this.transferCertificate.htmlContent(personNew,previousPerson,intrudedData,findTransfer,destinationAsset)


    try {
      await this.httpService.put(`${getConfig().api_pdf}convert/${findTransfer.pdf}`, {textPlain:htmlContentTransfer}).toPromise()
    } catch (error) {
      throw error.response?.data;	    
    }

    await findTransfer.depopulate()

    findTransfer.intruded = intruded
    findTransfer.origin = origin
    findTransfer.destination = destination
    findTransfer.reason = reason

    return await findTransfer.save();
  }










  async remove(id: string) {
    const transfer = await this.transfersModel.findById(id);
    
    if(!transfer){
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'no encotrado','no se encontro la transferencia que solicita')
    }
    transfer.isDeleted = true
    
    try {
      await this.httpService.delete(`${getConfig().api_pdf}convert/${transfer.pdf}`);
    } catch (error) {
      throw error.response?.data
    }
    return transfer.save();
  }


  async fetchData(url) {
    try {
      const response = await this.httpService.get(url).toPromise();
      return response.data;
    } catch (error) {
      throw error.response?.data;
    }
  }
}
