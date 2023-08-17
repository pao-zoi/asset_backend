import { ApiProperty } from "@nestjs/swagger";

export class CreateSupplierDto {
    @ApiProperty()
    managerName: string; 
    
    @ApiProperty()
    managerCi: string
    
    @ApiProperty()
    managerPhone: number

    @ApiProperty()
    businessAddress: string;

    @ApiProperty()
    email: string
    
    @ApiProperty()
    businessName:string

    @ApiProperty()
    NIT: string
}
