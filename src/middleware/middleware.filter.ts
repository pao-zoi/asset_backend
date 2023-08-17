import { HttpException, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class QueryParamsValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { offset, limit, state, nameAsset } = req.query;

const allowedFields = ['offset', 'limit', 'state', 'nameAsset'];
const queryParams = Object.keys(req.query);

const invalidFields = queryParams.filter(field => !allowedFields.includes(field));

if (invalidFields.length > 0) {
  res.status(400).send(`Campos no permitidos en los parámetros de consulta: ${invalidFields.join(', ')}`);
}

    if (offset !== undefined) {
      const parsedOffset = parseInt(offset.toString());
      if(parsedOffset >= 0){
      }else{throw new HttpException('offset debe ser mayor a 0',400)}      
    }
    
    if (limit !== undefined) {
      const parsedLimit = parseInt(limit.toString());
      if(parsedLimit >= 0){
        
      }else{throw new HttpException('limit debe ser mayor a 0',400)}
    }
    
    if (state !== undefined) {
      const validStates = ['AVAILABLE', 'IN_USE'];
      if (!validStates.includes(state.toString().toUpperCase())) {
        res.status(400).send('El valor del campo "state" debe ser "available" o "in_use".');
      }
      
    }
    
    if (nameAsset !== undefined) {
      if(/^[A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(nameAsset.toString())){
        
      }else{throw new HttpException('nameAsset solo acepta a-z A-Z 0-9',400)}
      
    }
    next();
  }
}