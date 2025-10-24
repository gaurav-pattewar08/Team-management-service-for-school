import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Team } from 'src/team/entities/team.entity';

@Table({ tableName: 'players', timestamps: true })
export class Player extends Model<Player> {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  dob: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  age: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  jerseyNumber: number;

  @Column({ type: DataType.STRING, allowNull: false })
  photoUrl: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isApproved: boolean;

  @ForeignKey(() => Team)
  @Column({ type: DataType.UUID, allowNull: false })
  teamId: string;

  @BelongsTo(() => Team)
  team: Team;
}
