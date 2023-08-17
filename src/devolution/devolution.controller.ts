import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Req, UseInterceptors } from '@nestjs/common';
import { DevolutionService } from './devolution.service';
import { CreateDevolutionDto } from './dto/create-devolution.dto';
import { UpdateDevolutionDto } from './dto/update-devolution.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { LoggerInterceptor } from 'src/interceptors/loggerInterceptors';
@ApiBearerAuth()
@ApiTags('devolution')
@Controller('devolution')
export class DevolutionController {
  constructor(private readonly devolutionService: DevolutionService) {}

  @UseInterceptors(LoggerInterceptor)
  @Post()
  create(@Body() createDevolutionDto: CreateDevolutionDto, @Req() req:Request) {
    createDevolutionDto={...createDevolutionDto,idUser:req.user.toString()}
    return this.devolutionService.create(createDevolutionDto);
  }

  @Get()
  findAll() {
    return this.devolutionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.devolutionService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDevolutionDto: UpdateDevolutionDto, @Req() req:Request) {
    updateDevolutionDto={...updateDevolutionDto,idUser:req.user.toString()}
    return this.devolutionService.update(id, updateDevolutionDto);
  }

  @UseInterceptors(LoggerInterceptor)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.devolutionService.remove(id);
  }
}
