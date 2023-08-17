import { ApiProperty } from '@nestjs/swagger';

export class UpdateDevolutionDto {
  @ApiProperty()
  assetIdNew: string;

  @ApiProperty()
  assetIdOld:string

  @ApiProperty()
  personId:string;


  // @ApiProperty()
  pdf: string;

  @ApiProperty()
  location:string;

  idUser:string
}
