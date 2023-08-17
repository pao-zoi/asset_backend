import { HttpException, Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { HttpService } from '@nestjs/axios';
import { Ufv, UfvDocument } from 'src/get-ufv/schema/ufvs.schema';
import { Asset, AssetDocument } from 'src/asset/schema/asset.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DepreciationAssetList, DepreciationAssetListDocument } from 'src/depreciation-asset-list/schema/depreciation-asset';
import { DepreciationService } from 'src/asset/depreciation.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
    @InjectModel(DepreciationAssetList.name) private depreciationAssetListModel: Model<DepreciationAssetListDocument>,
    @InjectModel(Ufv.name) private ufvmodel: Model<UfvDocument>,
    private httpService: HttpService,
    private depreciationService:DepreciationService,
  ) {}

  async getReports(createReportDto: CreateReportDto){
    let  { dateInitial, dateCurrent } = createReportDto
    const assets = await this.assetModel.find({});
    const reports = [] 
    
     
    if(dateInitial && dateCurrent){
      dateInitial = new Date(dateInitial).toISOString()
      dateCurrent = new Date(dateCurrent).toISOString()
      for(const asset of assets){
        const dateUfvInitial = dateInitial.split("T")[0];
        const dateUfvFinal = dateCurrent.split("T")[0];
  
        const findUvfInitial = await this.ufvmodel.findOne({fecha:dateUfvInitial})
        const findUvfFinal = await this.ufvmodel.findOne({fecha:dateUfvFinal})
        
        if(!findUvfInitial || !findUvfFinal){
          throw new HttpException('ufv no encotrada',404)
        } 

        let depreciation = await this.depreciationService.calculateAndStoreDepreciation(asset,new Date(dateCurrent))

        reports.push({ 
          nameAsset: asset.name,
          dateAcquisition:asset.informationCountable.dateAcquisition,
          ufvInitial:findUvfInitial.ufv,
          ufvFinal:findUvfFinal.ufv,
          depreciation:depreciation.depreciatedValue

        });
      }
      return reports
    }else{
      for(const asset of assets){
      
        const dateUfvInitial = asset.informationCountable.dateAcquisition.toISOString().split("T")[0];
        const dateUfvFinal = asset.createdAt.toISOString().split("T")[0];
  
        const findUvfInitial = await this.ufvmodel.findOne({fecha:dateUfvInitial})
        const findUvfFinal = await this.ufvmodel.findOne({fecha:dateUfvFinal})
        if(!findUvfInitial || !findUvfFinal){
          throw new HttpException('ufv no encotrada',404)
        }
        
        reports.push({ 
          nameAsset: asset.name,
          dateAcquisition:asset.informationCountable.dateAcquisition,
          ufvInitial:findUvfInitial.ufv,
          ufvFinal:findUvfFinal.ufv,
          depreciatedValue:`${asset.depreciatedValue}`
        });
      }
      return reports
    }
  }

  async findAll() {
    const assets = await this.assetModel.find({});
    const reports = [] 

    for(const asset of assets){
      const dateUfvInitial = asset.informationCountable.dateAcquisition.toISOString().split("T")[0];
      const dateUfvFinal = asset.createdAt.toISOString().split("T")[0];

      const findUvfInitial = await this.ufvmodel.findOne({fecha:dateUfvInitial})
      const findUvfFinal = await this.ufvmodel.findOne({fecha:dateUfvFinal})
      
      reports.push({ 
        nameAsset: asset.name,
        dateAcquisition:asset.informationCountable.dateAcquisition,
        ufvInitial:findUvfInitial.ufv,
        ufvFinal:findUvfFinal.ufv,
        depreciatedValue:`${asset.depreciatedValue}`
      });
    }
    return reports
  }

}
