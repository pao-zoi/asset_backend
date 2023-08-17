import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import getConfig from '../config/configuration';
import * as moment from 'moment';

@Injectable()
export class TransferCertificate {
  constructor(private httpService: HttpService) {}

  async htmlContent(personalNew,previousPersonal,intrudedPerson,findAsset,destinationAsset) {
    
    const {name, lastName}= personalNew
    const {name:previousPersonalName, lastName:previousPersonalLastName}= previousPersonal
    const {name:intrudedPersonName, lastName:intrudedPersonLastName}= intrudedPerson
    
    const formattedDateTime = new Date()
  const boliviaTime = moment.utc(formattedDateTime).tz('America/La_Paz');
  const date = boliviaTime.format('YYYY-MM-DD');

  const generateAssetRows = await Promise.all(findAsset.asset.map(async (assets) => {
    const { name, description } = assets.assetId;

    const { price } = assets.assetId.informationCountable 
    // let assetDestination;
    // try {
    //   const res = await this.httpService
    //     .get(`${getConfig().api_organigrama}main/${assets.destination}`)
    //     .toPromise();
    //   assetDestination = res.data.name;
    // } catch (error) {
    //   throw error.response?.data;
    // }
  
    // const reason = assets.reason;
    let dateTranfer = assets.date;
    dateTranfer = await boliviaTime.format('YYYY-MM-DD');
    return `
      <tr>
        <td>${name}</td>
        <td>${description}</td>
        <td>${price}</td>
        <td>${dateTranfer}</td>
      </tr>
    `;
  }));

  
    const htmlContent = `
    <!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acta de Transferencia</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        .container {
            background-color: #fff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            margin-bottom: 20px;
            color: #333;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #555;
        }
        .section-content {
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
            background-color: #f9f9f9;
        }
        p {
            margin: 10px 0;
            line-height: 1.6;
        }
        strong {
            color: #222;
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
    </style>
</head>
<body>
    <div class="container">
        <h1>Acta de Transferencia</h1>
        
        <div class="section">
            <div class="section-title">Detalles de la Transferencia</div>
            <div class="section-content">
                <p><strong>Fecha:</strong> ${date}</p>
                <p><strong>Responsable Emisor:</strong> ${name} ${lastName} </p>
                <p><strong>Responsable Receptor:</strong> ${previousPersonalName} ${previousPersonalLastName}</p>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Descripción de los Elementos Transferidos</div>
            <div class="section-content">
                <p>Descripción detallada de los elementos transferidos</p>
                <div class="table-container">
                    <table>
                        <tr>
                            <th>Activo</th>
                            <th>Descripción</th>
                            <th>Valor Unitario</th>
                            
                            <th>fecha de transferencia</th>
                        </tr> 
                        ${generateAssetRows.join('')}                      
                    </table>
                </div>
            </div>
        </div>
        
        <div class="section" >
            <div class="section-title">Firma y Aprobación</div>
            <div class="section-content" style="display: flex; flex-direction: row; justify-content: center;">
                <div style="margin-right: 20px;">
                    <br>
                    <p>______________________</p>
                    <p><strong>Firma Emisor: </strong>${name} ${lastName}</p>

                </div>
                <div style="margin-right: 20px;">
                    <br>
                    <p>______________________</p>
                    <p><strong>Firma Receptor: </strong>${previousPersonalName} ${previousPersonalLastName}</p>

                </div>
                <div>
                    <br>
                    <p>______________________</p>
                    <p><strong>Aprobado por: </strong> ${intrudedPersonName} ${intrudedPersonLastName}</p>

                </div>
            </div>
        </div>
    </div>
</body>
</html>


`;
    return htmlContent;
  }
}
