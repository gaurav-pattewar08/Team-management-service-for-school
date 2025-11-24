import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreationAttributes } from 'sequelize';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from 'src/common/roles.enum';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User) private userModel: typeof User) {}

  async create(createUserDto: CreateUserDto) {
    return await this.userModel.create(
      createUserDto as CreationAttributes<User>,
    );
  }

  async findByEmail(email: string) {
    return await this.userModel.findOne({ where: { email } });
  }
  async getAdmin() {
    return await this.userModel.findOne({ where: { role: Role.ADMIN } });
  }
}
