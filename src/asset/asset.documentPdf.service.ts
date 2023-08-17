import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Asset, AssetDocument } from './schema/asset.schema';
import { Model } from 'mongoose';
import getConfig from '../config/configuration';
@Injectable()
export class DocumentPdf {
  constructor(
    private httpService: HttpService,
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
  ) {}

  async htmlContent(asset, responsible, supplier) {
  
  // console.log('asset',asset)
  // console.log('responsible',responsible)
  // console.log('suplier',supplier)

  const { file } = asset;
    let image = null;
    if (file && file != 'string') {
      try {
        const res = await this.httpService
          .get(`${getConfig().file_upload}file/${asset.file}`)
          .toPromise();
        image = res.data.file.base64;
      } catch (error) {
        throw error.response?.data;
      }
    }
    const {
      managerName,
      managerCi,
      managerPhone,
      businessAddress,
      email,
      businessName,
      NIT,
    } = supplier;

    const { 
      name: responsibleName, 
      lastName: responsibleLastName, 
      ci: responsibleCi, 
      email: responsibleEmail, 
      phone: responsiblePhone, 
      address: responsibleDirection 
    } = responsible;

    const {
      price,
      dateAcquisition,
      warrantyExpirationDate,
      lote,
      code
    } = asset.informationCountable;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Reporte de Activo</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
        }
        h1 {
          text-align: center;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th, td {
          border: 1px solid #ccc;
          padding: 10px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        th[colspan="2"] {
          text-align: center;
        }
      </style>
    </head>
    <body>
      <h1>Reporte de Activo</h1>
      <table>
        <tr>
          <th colspan="2">Activo</th>
          <th>Descripción</th>
          <th>Unidad de Fomento a la Vivienda</th>
          <th>Depreciación</th>
          <th>Imagen</th>
        </tr>
        <tr>
          <td colspan="2">${asset.name}</td>
          <td>${asset.description}</td>
          <td>${asset.ufv4}</td>
          <td>${asset.depreciatedValue}</td>
          <td>
            <div style="text-align: center;" class="center-image">
              ${image
                ? `<img src="data:image/jpeg;base64,${image}" alt="imagen_activo" width="100" height="100" style="border-radius: 10px"/>`
                : `<p style="font-size: 12px; color: red;">El activo no tiene una imagen</p>`
              }
            </div>
          </td>
        </tr>
      </table>
  
      <h1>Información Contable</h1>
      <table>
        <tr>
          <th>Precio</th>
          <th>fecha de Adquisicion</th>
          <th>fecha de expiracion</th>
          <th>lote</th>
          <th>codigo</th> 
        </tr>
        <tr>
          <td>${price} Bs</td>
          <td>${dateAcquisition}</td>
          <td>${warrantyExpirationDate}</td>
          <td>${lote}</td>
          <td>${code.join('<br>')}</td>
        </tr>
      </table>

      <h1>Responsable</h1>
      <table>
        <tr>
          <th>nombre</th>
          <th>apellido</th>
          <th>ci</th>
          <th>email</th>
          <th>telefono</th> 
          <th>direccion</th> 
        </tr>
        <tr>
          <td>${responsibleName}</td>
          <td>${responsibleLastName}</td>
          <td>${responsibleCi}</td>
          <td>${responsibleEmail}</td>
          <td>${responsiblePhone}</td>
          <td>${responsibleDirection}</td>
        </tr>
      </table>
      
      <h1>Proveedor</h1>
      <table>
        <tr>
          <th>Nombre Encargado</th>
          <th>CI Encargado</th>
          <th>N° cel Encargado</th>
          <th>Dirección de trabajo</th>
          <th>Email</th>
          <th>Nombre de la empresa</th>
          <th>N° de Identificación Tributaria</th>
        </tr>
        <tr>
          <td>${managerName}</td>
          <td>${managerCi}</td>
          <td>${managerPhone}</td>
          <td>${businessAddress}</td>
          <td>${email}</td>
          <td>${businessName}</td>
          <td>${NIT}</td>
        </tr>
      </table>
  
    </body>
    </html>
`;
    return htmlContent;
  }
}
