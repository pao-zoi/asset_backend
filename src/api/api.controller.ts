import { Body, Controller, Get, HttpException, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { HttpService } from '@nestjs/axios';
import { VerifyTokenDTO } from './dto/verify.token.dto';
import getConfig from '../config/configuration'

// @ApiBearerAuth()
@ApiTags('apiAuth')
@Controller('api')
export class ApiController {
    constructor(
       private readonly httpService:HttpService, 
    ){}
		
	@Post('/redirect-to-main')
	async verifyToken(@Body() tokenObject:VerifyTokenDTO, @Res() res:Response){
		try {
			const {app, token} = tokenObject
			
			const response = await this.httpService.post(`${getConfig().verify_token}auth/verify-app-token`,tokenObject).toPromise();		
			res.status(200).send(response.data)
			
		} catch (error) {
			if (error.response) {
				const { status, data } = error.response;
				res.status(status).send(data);
			  } else {
				throw new HttpException('ocurrio un error', HttpStatus.INTERNAL_SERVER_ERROR);
			  }
		}		
	}
}