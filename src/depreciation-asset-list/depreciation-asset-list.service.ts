import { HttpException, Injectable } from '@nestjs/common';
import { CreateDepreciationAssetListDto } from './dto/create-depreciation-asset-list.dto';
import { InjectModel } from '@nestjs/mongoose';
import { DepreciationAssetList, DepreciationAssetListDocument } from './schema/depreciation-asset';
import { Model } from 'mongoose';

@Injectable()
export class DepreciationAssetListService {

  constructor(
    @InjectModel(DepreciationAssetList.name) private depreciationAssetListModel: Model<DepreciationAssetListDocument>, 
  ){}

  async setDataDefault() {
    const count = await this.depreciationAssetListModel.estimatedDocumentCount();
    if (count > 0) return;
    const values = await Promise.all([
      this.depreciationAssetListModel.create({ assetCategory: 'Edificaciones', usefulLife:40 }),

      this.depreciationAssetListModel.create({ assetCategory: 'Muebles y enseres de oficina', usefulLife:10}),

      this.depreciationAssetListModel.create({ assetCategory: 'Maquinaria en general', usefulLife:8}),

      this.depreciationAssetListModel.create({ assetCategory: 'Equipos e instalaciones', usefulLife:8,}),

      this.depreciationAssetListModel.create({ assetCategory: 'Barcos y lanchas en general', usefulLife:10 }),
      
      this.depreciationAssetListModel.create({ assetCategory: 'Vehiculos automotores', usefulLife:5 }),

      this.depreciationAssetListModel.create({ assetCategory: 'Aviones', usefulLife:5 }),

      this.depreciationAssetListModel.create({ assetCategory: 'Maquinaria para la construccion', usefulLife:5 }),

      this.depreciationAssetListModel.create({ assetCategory: 'Maquinaria agricola', usefulLife:4 }),

      this.depreciationAssetListModel.create({ assetCategory: 'Animales de trabajo', usefulLife:4 }),

      this.depreciationAssetListModel.create({ assetCategory: 'Herramientas en general', usefulLife:4 }),


      this.depreciationAssetListModel.create({ assetCategory: 'Reproductores y hembras de pedigree o puros por cruza', usefulLife:8 }),

      this.depreciationAssetListModel.create({ assetCategory: 'Equipos de computación', usefulLife:4 }),

      this.depreciationAssetListModel.create({ assetCategory: 'Canales de regadío y pozos', usefulLife:20 }),


      this.depreciationAssetListModel.create({ assetCategory: 'Estanques, bañaderos y abrevaderos', usefulLife:10 }),

      this.depreciationAssetListModel.create({ assetCategory: 'Alambrados, tranqueras y vallas', usefulLife:10 }),

      this.depreciationAssetListModel.create({ assetCategory: 'Viviendas para el personal', usefulLife:20 }),

      this.depreciationAssetListModel.create({ assetCategory: 'Muebles y enseres en las viviendas para el personal', usefulLife:10 }),

      this.depreciationAssetListModel.create({ assetCategory: 'Silos, almacenes y galpones', usefulLife:20 }),
      
      this.depreciationAssetListModel.create({ assetCategory: 'Tinglados y cobertizos de madera', usefulLife:5 }),
      
      this.depreciationAssetListModel.create({ assetCategory: 'Instalaciones de electrificación y telefonía rurales', usefulLife:10 }),

      this.depreciationAssetListModel.create({ assetCategory: 'Caminos interiores', usefulLife:10 }),

      this.depreciationAssetListModel.create({ assetCategory: 'Caña de azúcar', usefulLife:5 }),

      this.depreciationAssetListModel.create({ assetCategory: 'Vides', usefulLife:8 }),
      
      this.depreciationAssetListModel.create({ assetCategory: 'Frutales', usefulLife:10 }),
      
      this.depreciationAssetListModel.create({ assetCategory: 'Pozos Petroleros', usefulLife:5 }),

      this.depreciationAssetListModel.create({ assetCategory: 'Líneas de Recolección de la industria petrolera', usefulLife:5 }),

      this.depreciationAssetListModel.create({ assetCategory: 'Equipos de campo cié la industria petrolera', usefulLife:8 }),

      this.depreciationAssetListModel.create({ assetCategory: 'Plantas de Procesamiento de la industria petrolera', usefulLife:8 }),

      this.depreciationAssetListModel.create({ assetCategory: 'Ductos de la industria petrolera', usefulLife:10 }),

    ]);
    return values;
  }

  async create(createDepreciationAssetListDto: CreateDepreciationAssetListDto) {
    return await this.depreciationAssetListModel.create(createDepreciationAssetListDto);
  }

  async findAll() {
    return await this.depreciationAssetListModel.find();
  }

  async findOne(id: string) {
    return await this.depreciationAssetListModel.findById(id);
  }

  async update(id: string, updateDepreciationAssetListDto: CreateDepreciationAssetListDto) {
    return await this.depreciationAssetListModel.findByIdAndUpdate(id,updateDepreciationAssetListDto,{new:true});
  }

  async darDeBaja(_id: string) {
    const asset = await this.depreciationAssetListModel.findOne({ _id });
    if (!asset) {
      throw new HttpException('activo no encontrado', 404);
    }
    asset.isDeleted = true;   
    return asset.save();
  }

  async updateEstado(activoId: string, estado: string): Promise<void> {
    await this.depreciationAssetListModel.findOneAndUpdate({ _id: activoId }, { estado });
  }
}
