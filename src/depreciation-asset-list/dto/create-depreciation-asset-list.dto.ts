import { ApiProperty } from "@nestjs/swagger";

export class CreateDepreciationAssetListDto {
  @ApiProperty()
  assetCategory: string; 
  @ApiProperty()
  usefulLife: number;
}
