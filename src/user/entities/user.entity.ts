import { Column, DataType, HasOne, Model, Table } from 'sequelize-typescript';
import { Coach } from 'src/coach/entities/coach.entity';
import { Role } from 'src/common/roles.enum';

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model<User> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4, // ✅ Automatically generate UUID
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare password: string;

  @Column({
    type: DataType.ENUM(...Object.values(Role)),
    allowNull: false,
  })
  declare role: Role;

  @HasOne(() => Coach)
  declare coach: Coach;

}
