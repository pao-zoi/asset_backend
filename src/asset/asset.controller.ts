import { Controller, Get, Post, Body, Patch, Param, Delete,  UseInterceptors, UploadedFile, Put,  UploadedFiles, Res, UseGuards, HttpStatus, Req, Query } from '@nestjs/common';
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { HttpService } from '@nestjs/axios';
import getConfig from '../config/configuration'
import { Response, Request } from 'express';
import { RolesGuard } from 'src/guard/roles.guard';
import { CustomErrorService } from 'src/error.service';
import { Permission } from 'src/guard/constants/permission';
import { Permissions } from '../guard/decorators/permissions.decorator'
import { FilterAssetDto } from './dto/filter.asset.dto';
import { LoggerInterceptor } from 'src/interceptors/loggerInterceptors';

@ApiBearerAuth()
@ApiTags('asset') 
// @UseGuards(RolesGuard)

@Controller('/asset')
export class AssetController {
  constructor(
    private readonly assetService: AssetService,
    private httpService:HttpService,
    private customErrorService:CustomErrorService
    ) {}


  // @Permissions(Permission.CREAR_ACTIVO)
  @UseInterceptors(LoggerInterceptor)
  @Post()
  async create(@Body() createAssetDto: CreateAssetDto, @Req() req:Request ) {
    
    createAssetDto.responsible = req.user.toString()

    return await this.assetService.create(createAssetDto);
  }

  
  @ApiQuery({ name: 'nameAsset', description: 'ingrese el nombre por el cual desea filtrar el activo', required: false })
  @ApiQuery({ name: 'state', description: 'estado del activo ocupado disponible', required: false, enum:['AVAILABLE','IN_USE'] })

  @ApiQuery({ name: 'limit', description: 'ingrese la cantidad de activos a visualizar', required: false})
  @ApiQuery({ name: 'offset', description: 'desde que activo desea listar', required: false }) 
  

  @Get()
  async findAll(@Query() params?:FilterAssetDto) {
    const data = await this.assetService.findAll(params);
    return data
  }


  @Get('/:id')  
  async findOne(@Param('id') id: string) {
    return await this.assetService.findOne(id);
  }

  // @Permissions(Permission.EDITAR_ACTIVO)
  @UseInterceptors(LoggerInterceptor)
  @Put('/:id')
    async update(@Param('id') id: string, @Body() updateAssetDto: CreateAssetDto, @Req() req:Request) {
      updateAssetDto.responsible = req.user.toString()
    return await this.assetService.update(id, updateAssetDto);
  }

  // @Permissions(Permission.ELIMINAR_ACTIVO)
  @UseInterceptors(LoggerInterceptor)
  @Delete('/:id')
  async darDeBaja(@Param('id') id: string) {
    return await this.assetService.darDeBaja(id);
  } 


  // @UseInterceptors(LoggerInterceptor)
  // @Delete('/:id')
  // async darDeBaja(@Param('id') id: string, @Res() res: Response) {
  //   await this.assetService.darDeBaja(id);
  //   res.send({message:'activo eliminado correctamente'})
  // } 
}

