import { ApiProperty } from "@nestjs/swagger";

export class CreateDeliveryDto {
  @ApiProperty()
  assetId: string;

  @ApiProperty()
  personId:string;

    // @ApiProperty()
    pdf: string;

    @ApiProperty()
    location:string;

    idUser:string
}
