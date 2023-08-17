import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Res, HttpException, UseInterceptors } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { LoggerInterceptor } from 'src/interceptors/loggerInterceptors';

@ApiTags('supplier')
@ApiBearerAuth()
@Controller('supplier')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @UseInterceptors(LoggerInterceptor)
  @Post()
  async create(@Body() createSupplierDto: CreateSupplierDto) {
    return await this.supplierService.create(createSupplierDto);
  }

  @Get()
  async findAll() {
     const data = await this.supplierService.findAll();
     return data
  }

  @Get('/:id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.supplierService.findOne(id);
    } catch (error) {
      if(error instanceof HttpException){
        throw error
      }
    }
  }

  @UseInterceptors(LoggerInterceptor)
  @Put('update/:id')
  async update(@Param('id') id: string, @Body() updateSupplierDto: CreateSupplierDto) {
    return await this.supplierService.update(id, updateSupplierDto);
  }

  @UseInterceptors(LoggerInterceptor)
  @Delete(':id')
  async remove(@Param('id') id: string,) {
    return await this.supplierService.remove(id);
  }

  @UseInterceptors(LoggerInterceptor)
  @Put('restart-supplier/:id')
  async restartSupplier(@Param('id') id: string) {
     return await this.supplierService.restartsupplier(id);
  }
}
