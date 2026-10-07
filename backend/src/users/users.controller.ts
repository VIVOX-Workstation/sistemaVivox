import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { UpdateModulosDto } from './dto/update-modulos.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('setup')
  setup(@Body() createUserDto: CreateUserDto) {
    return this.usersService.setup(createUserDto);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // Colaborador só edita a própria conta; papel e módulos têm rotas exclusivas do ADMIN
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: { user: { userId: string; role: Role } },
  ) {
    if (req.user.role !== Role.ADMIN && req.user.userId !== id) {
      throw new ForbiddenException('Você só pode editar a sua própria conta.');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateRole(@Param('id') id: string, @Body('role') role: Role) {
    return this.usersService.updateRole(id, role);
  }

  @Patch(':id/modulos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateModulos(@Param('id') id: string, @Body() dto: UpdateModulosDto) {
    return this.usersService.updateModulos(id, dto.modulos);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
