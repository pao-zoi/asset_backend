import { ApiProperty } from "@nestjs/swagger";

export class CreateAssetDto {
    @ApiProperty()
    name: string; 
    
    @ApiProperty()
    description: string;

    // @ApiProperty()
    responsible:string; 
    
    @ApiProperty()
    supplier:string; 

    @ApiProperty()
    file?: string

    // @ApiProperty()
    // location:string;

    ufv3:string
    ufv4:string

    depreciatedValue:number
    
    @ApiProperty()
    typeCategoryAsset: string;
    
    @ApiProperty({
      type: Object,
      properties: {
        price: { type: 'number' },
        dateAcquisition: { type: 'string', format: 'date' },
        warrantyExpirationDate: { type: 'string', format: 'date' },
        // documentPdf: { type: 'string' },
        lote: { type: 'number' },
        // code: { type: 'string' },
      },
    })
    informationCountable: {
      price: number;
      dateAcquisition: Date;
      warrantyExpirationDate: Date;
      // documentPdf: string;
      lote: number;
      // code: string;
    };

    @ApiProperty({
      type: Object,
      properties: {
        located: { type: 'string' },
      },
    })
    location: { 
      located:string
    }; 
}
