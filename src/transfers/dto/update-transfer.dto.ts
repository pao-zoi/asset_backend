import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateTransferDto } from './create-transfer.dto';

export class UpdateTransferDto {
  // @ApiProperty()
  // assetId:string;
  
  @ApiProperty()
  intruded:string;  //por intrucciones de quien se realiza la transferenia 

  @ApiProperty()
  origin:string;  //origen del activo

  @ApiProperty()
  destination:string; //nueva ubicacion 

  // @ApiProperty()
  // personalNew:string; //nueva personal asignado al activo
  
  // @ApiProperty()
  // previousPersonal:string;  //anterior  personal
  
  @ApiProperty()
  reason:string;  //motivo por el cual se realiza la transferencia 
  
  // @ApiProperty()
  pdf: string;

  idUser:string;

  location
}



