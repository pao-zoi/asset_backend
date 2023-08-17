import { HttpService } from '@nestjs/axios';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Model } from 'mongoose';
import { Bitacora, BitacoraDocument } from 'src/bitacora/schema/bitacora.schema';
import getConfig from '../config/configuration'
import { CustomErrorService } from 'src/error.service';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment-timezone';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(
    private httpService: HttpService,
    @InjectModel(Bitacora.name) private readonly bitacoraModel: Model<BitacoraDocument>,
  ) {}

   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
      return next.handle().pipe(
        map(async(data) => {
          const resPersonal = await this.httpService.get(`${getConfig().api_personal}api/personal/${req.user}`).toPromise();
          const dataPersonal = resPersonal.data;

          let resPersonalDevolution
         if(data.personId){
           resPersonalDevolution = await this.httpService.get(`${getConfig().api_personal}api/personal/${data.personId}`).toPromise();
         }
            let description = '';
            switch (req.method) {
              case 'POST':
                if (req.path === '/get-ufv') {
                  description = `solicito ufvs a la bcb de las fechas ${req.body.dateInitial} al ${req.body.dateCurrent}`;
                } else if (req.path.startsWith('/asset')
                  //req.path === '/asset'
                  ) {
                  description = `creo un activo con id: ${data._id}`;
                } else if(req.path === '/depreciation-asset-list') {
                  description = `creo un grupo contable con id: ${data._id}`; 
                } else if(req.path === '/supplier'){
                  description = `creo un proveedor con id: ${data._id}`;
                }else if(req.path === '/api/redirect-to-main'){
                  description = 'inicio sesion en la app activos';                 
                }else if(req.path === '/delivery'){
                  description = `registro una entrega de un activo con id: ${data._id} `;
                }else if(req.path === '/devolution'){
                  
                  description = `${resPersonalDevolution.data.email} entrego un activo a ${dataPersonal.email} con id: ${data._id}`;
                }else if(req.path === '/transfers'){
                  description = `realizo un registro de transferencia con id: ${data._id}`;
                }
                
                else if(req.path === '/permission'){
                  description = `creo un permiso con id: `;
                }
                
    
                break;
              case 'PUT':
                if (req.path.startsWith('/asset')){
                  description = `actualizo un activo con id: ${data._id}`
                }else if (req.path.startsWith('/depreciation-asset-list')){
                  description = `actualizo un grupo contable con id: ${data._id}`
                }else if (req.path.startsWith('/supplier/update')){
                  description = `actualizo un proveedor con id: ${data._id}`
                }else if (req.path.startsWith(`/supplier/restart-supplier ${data._id}`)){
                  description = `restauro un proveedor con id: ${data._id}`
                }else if (req.path.startsWith('/delivery')){
                  description = `actualizo la entrega con el id: ${data._id}`
                }else if (req.path.startsWith('/devolution')){
                  description = `actualizo la acta de devolucion: ${data._id}`
                }else if (req.path.startsWith('/transfers')){
                  description = `actualizo la acta de transfers: ${data._id}`
                }
                else if (req.path.startsWith('/permission')){
                  description = `actualizo un permiso con el id: `
                }

                

                break;
              case 'DELETE':
                if (req.path.startsWith('/asset')){
                  description = `elimino un activo con id: ${data._id}`;
                }else if (req.path.startsWith('/depreciation-asset-list')){
                  description = `elimino un grupo contable con id: ${data._id}`
                }else if (req.path.startsWith('/supplier')){
                  description = `elimino un proveedor con id: ${data._id}`
                }else if (req.path.startsWith('/delivery')){
                  description = `elimino la entrega con id: ${data._id}`
                }else if (req.path.startsWith('/devolution')){
                  description = `elimino el registro de devolucion con id: ${data._id}`
                }else if (req.path.startsWith('/transfers')){
                  description = `elimino el registro de transferencia: ${data._id}`
                }
                
                else if (req.path.startsWith('/permission')){
                  description = `elimino un permiso con id: `
                }
                
                break;
              default:
                description = 'peticion de Get';
                break;
            }
          
            const date = new Date()
            const boliviaTime = moment.utc(date).tz('America/La_Paz');
            const formattedDateTime = boliviaTime.format('YYYY-MM-DD:HH:mm:ss');

            const bitacoraEntry = new this.bitacoraModel({
              userId:req.user,
              userEmail: dataPersonal.email,
              action: `Método: ${req.method}`,
              description,
              path: `${req.headers['origin']}${req.url}`,
              timestamp:formattedDateTime
            });
            await bitacoraEntry.save();
            return data; 
        }),
      )   
    return next.handle();
  }
}
