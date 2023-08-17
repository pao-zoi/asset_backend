import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, UseGuards, UseInterceptors } from '@nestjs/common';
import { GetUfvService } from './get-ufv.service';
import { CreateGetUfvDto } from './dto/create-get-ufv.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CustomErrorService } from 'src/error.service';
import { RolesGuard } from 'src/guard/roles.guard';
import { Permissions } from '../guard/decorators/permissions.decorator'
import { Permission } from 'src/guard/constants/permission';
import { LoggerInterceptor } from 'src/interceptors/loggerInterceptors';
import { FindUfvDto } from './dto/find-ufv.dto';

@ApiTags('get-ufv-from-bcb')
@ApiBearerAuth()
// @UseGuards(RolesGuard)
@Controller('get-ufv')
export class GetUfvController {
  constructor(
    private readonly getUfvService: GetUfvService,
    private customErrorService:CustomErrorService
    ) {}

  // @Permissions(Permission.OBTENER_UFVS_DEL_BCB)
  @UseInterceptors(LoggerInterceptor)
  @Post()
  async create(@Body() createGetUfvDto: CreateGetUfvDto) {
    const data = await this.getUfvService.getUfvFromBcb(createGetUfvDto);
    
    if(data.length==0){
      return {message:'la ufv que solicita ya esta guardada'}
    }
    return data
  }

  // @Permissions(Permission.OBTENER_UFVS)
  @Get()
  findAll() {
    return this.getUfvService.findAll();
  }

  @Post('/find-ufv-current')
  findDateId(@Body() findUfvDto: FindUfvDto) {
    return this.getUfvService.findDate(findUfvDto);
  }

}
