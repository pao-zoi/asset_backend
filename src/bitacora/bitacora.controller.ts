import { Controller, Get } from '@nestjs/common';
import { BitacoraService } from './bitacora.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('bitacora')
@Controller('bitacora')
export class BitacoraController {
  constructor(private readonly bitacoraService: BitacoraService) {}

  @Get()
  async getBitacora(){
    return await this.bitacoraService.getAllBitacora()
  }
}
