
export class FilterAssetDto {
  // @IsOptional()
  // @IsPositive()
  limit: number;

  // @IsOptional()
  // @Min(0)
  offset: number;

  // @IsOptional()
  nameAsset: string;

  // @IsOptional()
  state: string;
}
