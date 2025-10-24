import { Column, DataType, Model, Table, ForeignKey, BelongsTo, HasOne } from 'sequelize-typescript';
import { School } from 'src/school/entities/school.entity';
import { Team } from 'src/team/entities/team.entity';
import { User } from 'src/user/entities/user.entity';

@Table({
  tableName: 'coaches',
  timestamps: true,
})
export class Coach extends Model<Coach> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4, 
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare userId: string;

  @ForeignKey(() => School)
  @Column({ type: DataType.UUID, allowNull: false })
  declare schoolId: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare isVerified: boolean;

   @BelongsTo(() => User)
  declare user: User;

  @HasOne(() => Team)
  team: Team;
}
