import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Req, Res, Query, UseInterceptors } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'Express'
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { FilterDeliveryDto } from './dto/filter.delivery.dto';
import { LoggerInterceptor } from 'src/interceptors/loggerInterceptors';


@ApiTags('delivery')
@ApiBearerAuth()
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @UseInterceptors(LoggerInterceptor)
  @Post()
  create(@Body() createDeliveryDto: CreateDeliveryDto, @Req() req:Request) {

    createDeliveryDto = {...createDeliveryDto, idUser:req.user.toString()}

    return this.deliveryService.create(createDeliveryDto);
  }


  @Get()
  findAll() {
    return this.deliveryService.findAll();
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.deliveryService.findOne(id);
  }

  @UseInterceptors(LoggerInterceptor)
  @Put('/:id')
  update(@Param('id') id: string, @Body() updateDeliveryDto: UpdateDeliveryDto, @Req() req:Request) {
    updateDeliveryDto = {...updateDeliveryDto, idUser:req.user.toString()}
    return this.deliveryService.update(id, updateDeliveryDto);
  }

  @UseInterceptors(LoggerInterceptor)
  @Delete('/:id')
  async darDeBaja(@Param('id') id: string) {
    return await this.deliveryService.darDeBaja(id);
  }

  @Post('/edit/')
  async editDeliveries() {
    try {
      const deliveries = await this.deliveryService.editDelivery();
      return deliveries;
    } catch (error) {
      // Handle error
    }
  }


}
