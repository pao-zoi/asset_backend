import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import getConfig from '../config/configuration';

@Injectable()
export class DeliveryCertificate {
  constructor(private httpService: HttpService) {}

  async htmlContent(assets, person, responsible, cargo?) {
    if (cargo) {
      try {
        const res = await this.httpService
          .get(`${getConfig().api_personal}api/charge/${cargo}`)
          .toPromise();
        cargo = res.data.name;
      } catch (error) {
        throw error.response?.data;
      }
    }

    let responsibleFound;
    try {
      const res = await this.httpService
        .get(`${getConfig().api_personal}api/personal/${responsible.idUser}`)
        .toPromise();
      responsibleFound = res.data;
    } catch (error) {
      
      throw new HttpException('persona no encontrada', HttpStatus.NOT_FOUND);
    }

    const { name: nameResponsible, lastName: lastNameResponsible } =
      responsibleFound;

    const dateCurrent = new Date();
    const date = dateCurrent.toISOString().split('T')[0];

    const { name: namePerson, lastName } = person;

    const length = assets?.assetId?.length ?? assets.length;

    const generateAssetRows = (assets.assetId ? assets.assetId : assets).map(
      (asset) => {
        const { name, description } = asset;
        const position = cargo;
        const { price } = asset.informationCountable;
        const { location } = responsible;
        return `
      <tr>
        <td>${name}</td>
        <td>${description}</td>
        <td>${position}</td>
        <td>${location}</td>
        <td>${price}</td>
      </tr>
    `;
      },
    );

    const htmlContent = `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acta de Entrega de Activo</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ccc;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
        }

        .header h1 {
            font-size: 28px;
            margin: 0;
        }

        .header p {
            font-size: 16px;
            margin: 0;
        }

        .table-container {
            margin-bottom: 20px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            border: 1px solid #ccc;
            padding: 10px;
            text-align: left;
        }

        th {
            background-color: #f2f2f2;
        }

        .signature {
            margin-top: 40px;
            text-align: center;
        }

        .signature p {
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Acta de Entrega de Activo</h1>
            <p>Fecha: ${date}</p>
        </div>

        <div class="table-container">
            <table>
                <tr>
                    <th>Activo</th>
                    <th>Descripción</th>
                    <th>Cargo</th>
                    <th>Ubicación</th>
                    <th>Valor Unitario</th>
                </tr>

                ${generateAssetRows.join('')}
                
                <tr>
                  <td colspan="3"><b> Total de activos asignados ${length} </b></td>
                </tr>
                
            </table>
        </div>

        <div class="signature">
            <p>___________________________</p>
            <p>Firma del entregador ${nameResponsible} ${lastNameResponsible}</p>
        </div>

        <div class="signature">
            <p>___________________________</p>
            <p>Firma del receptor ${namePerson} ${lastName}</p>
        </div>
    </div>
</body>
</html>

`;
    return htmlContent;
  }
}
