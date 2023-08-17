import { ApiProperty } from "@nestjs/swagger";

export class CreateTransferDto {
  @ApiProperty()
  assetId:string;
  
  @ApiProperty()
  intruded:string;  //por intrucciones de quien se realiza la transferenia 

  @ApiProperty()
  origin:string;  //origen del activo

  @ApiProperty()
  destination:string; //nueva ubicacion 

  @ApiProperty()
  personalNew:string; //nueva personal asignado al activo
  
  @ApiProperty()
  previousPersonal:string;  //anterior  personal
  
  @ApiProperty()
  reason:string;  //motivo por el cual se realiza la transferencia 
  
  // @ApiProperty()
  pdf: string;

  idUser:string;

  location
}

