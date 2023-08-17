import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseInterceptors, Req } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LoggerInterceptor } from 'src/interceptors/loggerInterceptors';
import { Request } from 'express'

@ApiTags('transfer')
@ApiBearerAuth()
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @UseInterceptors(LoggerInterceptor)
  @Post()
  create(@Body() createTransferDto: CreateTransferDto, @Req() req:Request) {
    createTransferDto = {...createTransferDto, idUser:req.user.toString()}
    return this.transfersService.create(createTransferDto);
  }

  @Get()
  findAll() {
    return this.transfersService.findAll();
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.transfersService.findOne(id);
  }

  @UseInterceptors(LoggerInterceptor)
  @Put('/:id')
  update(@Param('id') id: string, @Body() updateTransferDto: UpdateTransferDto, @Req() req:Request) {
    
    updateTransferDto = {...updateTransferDto, idUser:req.user.toString()}
    return this.transfersService.update(id, updateTransferDto);
  }

  @UseInterceptors(LoggerInterceptor)
  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.transfersService.remove(id);
  }
}
