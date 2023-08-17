import { ApiProperty } from "@nestjs/swagger";

export class CreateDevolutionDto {
  @ApiProperty()
  assetId: string;
  
  responsibleId: string;

  @ApiProperty()
  personId:string;



  // @ApiProperty()
  pdf: string;

  @ApiProperty()
  location:string;

  idUser:string
}
