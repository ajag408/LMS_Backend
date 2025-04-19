import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    ParseIntPipe,
    NotFoundException,
    BadRequestException,
    HttpStatus,
    HttpCode,
    UseGuards
  } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport'; // This will be provided by the auth team
  import { RolesGuard } from '../common/guards/roles.guard';
  import { Roles } from '../common/decorators/roles.decorator';
  import { UserService } from './user.service';
  import {
    CreateUserDto,
    UpdateUserDto,
    UserResponseDto,
    PaginationQueryDto,
    ChangePasswordDto,
  } from './dto';
  
  @Controller('users')
  @UseGuards(AuthGuard('jwt'), RolesGuard) // Apply guards to all endpoints
  export class UserController {
    constructor(private readonly userService: UserService) {}
  
    @Post()
    @Roles('admin') // Only admins can create users
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
      try {
        return await this.userService.create(createUserDto);
      } catch (error) {
        if (error.message.includes('duplicate')) {
          throw new BadRequestException('Email already exists');
        }
        throw error;
      }
    }
  
    @Get()
    @Roles('admin', 'instructor') // Admins and instructors can list users
    async findAll(@Query() paginationQuery: PaginationQueryDto) {
      return this.userService.findAll(paginationQuery);
    }
  
    @Get(':id')
    @Roles('admin', 'instructor') // Admins and instructors can view users
    async findOne(@Param('id') id: string): Promise<UserResponseDto> {
      const user = await this.userService.findOne(id);
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user;
    }
  
    @Patch(':id')
    @Roles('admin') // Only admins can update users
    async update(
      @Param('id') id: string,
      @Body() updateUserDto: UpdateUserDto,
    ): Promise<UserResponseDto> {
      try {
        return await this.userService.update(id, updateUserDto);
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        throw new BadRequestException('Failed to update user');
      }
    }
  
    @Delete(':id')
    @Roles('admin') // Only admins can delete users
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string): Promise<void> {
      try {
        await this.userService.remove(id);
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        throw new BadRequestException('Failed to delete user');
      }
    }
  
    @Patch(':id/change-password')
    @HttpCode(HttpStatus.NO_CONTENT)
    async changePassword(
      @Param('id') id: string,
      @Body() changePasswordDto: ChangePasswordDto,
    ): Promise<void> {
      try {
        await this.userService.changePassword(
          id,
          changePasswordDto.currentPassword,
          changePasswordDto.newPassword,
        );
      } catch (error) {
        throw new BadRequestException(error.message);
      }
    }
  }