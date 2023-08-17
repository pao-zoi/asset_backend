import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards, Res, HttpStatus, UseInterceptors } from '@nestjs/common';
import { DepreciationAssetListService } from './depreciation-asset-list.service';
import { CreateDepreciationAssetListDto } from './dto/create-depreciation-asset-list.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../guard/decorators/permissions.decorator'
import { Permission } from 'src/guard/constants/permission';
import { RolesGuard } from 'src/guard/roles.guard';
import { LoggerInterceptor } from 'src/interceptors/loggerInterceptors';


@ApiTags('accounting-groups')
@ApiBearerAuth()
// @UseGuards(RolesGuard)

@Controller('/depreciation-asset-list')
export class DepreciationAssetListController {
  constructor(private readonly depreciationAssetListService: DepreciationAssetListService) {}

  // @Permissions(Permission.CREAR_GRUPO_CONTABLE)
  @UseInterceptors(LoggerInterceptor)
  @Post()
  create(@Body() createDepreciationAssetListDto: CreateDepreciationAssetListDto) {
    return this.depreciationAssetListService.create(createDepreciationAssetListDto);
  }

  @Get()
  findAll() {
    return this.depreciationAssetListService.findAll();
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.depreciationAssetListService.findOne(id);
  }

  // @Permissions(Permission.EDITAR_GRUPO_CONTABLE)
  @UseInterceptors(LoggerInterceptor)
  @Put('/:id')
  update(@Param('id') id: string, @Body() updateDepreciationAssetListDto:CreateDepreciationAssetListDto) {
    return this.depreciationAssetListService.update(id, updateDepreciationAssetListDto);
  }
  
  // @Permissions(Permission.ELIMINAR_GRUPO_CONTABLE)
  @UseInterceptors(LoggerInterceptor)
  @Delete('/:id')
  async darDeBaja(@Param('id') id: string, @Res() res: any) {
    return await this.depreciationAssetListService.darDeBaja(id);
  }

  // @UseInterceptors(LoggerInterceptor)
  // @Delete('/:id')
  // async darDeBaja(@Param('id') id: string, @Res() res: any) {
  //   return await this.depreciationAssetListService.darDeBaja(id);
  // }
}
