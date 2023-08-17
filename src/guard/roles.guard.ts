import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from './constants/permission';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PermissionDocument, Permission as PermissionSchema} from 'src/permission/schema/permission.schema';


@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private httpService:HttpService,
    @InjectModel(PermissionSchema.name) private readonly permissionModel: Model<PermissionDocument>,
    ) {}

  async canActivate(context: ExecutionContext){
    
    const requiredPermission = this.reflector.getAllAndOverride<Permission[]>('permissions', [ context.getHandler(), context.getClass()]);

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('No autorizado, no existe token');
    }

    let userPermission
    
    try {
      const decodedToken = await this.httpService.post('https://falling-resonance-1516.fly.dev/auth/decoded',{token}).toPromise() 
      if(decodedToken.data.roles.length ===0){
        throw new HttpException('no tiene roles',401)
      }
      const rolesWithDetails = await Promise.all(decodedToken.data.roles.map(roleId =>this.httpService.get(`https://falling-resonance-1516.fly.dev/rol/${roleId}`).toPromise()
      ));
      const roleDetails = rolesWithDetails.map(response => response.data);
      userPermission = roleDetails.map(index => index.permissionName).flat()
    } catch (error) {
      if(error instanceof HttpException){
        throw error
      }
      throw error.response?.data
    }
    
    const findAllPermission = await this.permissionModel.find()

    const filteredPermissions = findAllPermission.filter(permission => userPermission.includes(permission._id.toString()));
    
    for (const permission of filteredPermissions) {
      if (requiredPermission[0] == permission.permissionName) {
        return true;
      }
    }
    throw new UnauthorizedException('No tienes permisos para ejecutar esta acción');
  }

  private extractTokenFromHeader(request: Request & { headers: { authorization?: string } }): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
