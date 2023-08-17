import { HttpService } from '@nestjs/axios';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import getConfig from '../config/configuration'
import { RolesGuard } from 'src/guard/roles.guard';
import { Permissions } from '../guard/decorators/permissions.decorator'
import { Permission } from 'src/guard/constants/permission';

@ApiTags('personals')
// @ApiBearerAuth()
@UseGuards(RolesGuard)

@Controller('personal')
export class PersonalController {
  constructor(private httpService:HttpService ) {}

  // @Permissions(Permission.OBTENER_USUARIOS)
  @Get()
  async findAll() {
    const response = await this.httpService.get(`${getConfig().api_personal}api/personal`).toPromise();
    
    let data =[]
    for(const dataPersonal of response.data){
      data.push({
        _id:dataPersonal._id,
        fullName: `${dataPersonal.name} ${dataPersonal.lastName}`,
        email:dataPersonal.email
      })
    }
    return data
  }

}
