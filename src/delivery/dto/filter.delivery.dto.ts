export class FilterDeliveryDto {
    // @IsOptional()
    // @IsPositive()
    limit: number;
  
    // @IsOptional()
    // @Min(0)
    offset: number;
  
    // @IsOptional()
    positionOfficial: string;
  
    // @IsOptional()
    location: string;
  }