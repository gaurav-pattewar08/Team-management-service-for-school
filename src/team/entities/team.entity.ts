import { Table, Column, Model, DataType, ForeignKey, HasMany, BelongsTo } from 'sequelize-typescript';
import { Coach } from 'src/coach/entities/coach.entity';
import { Player } from 'src/player/entities/player.entity';

@Table({ tableName: 'teams', timestamps: true })
export class Team extends Model<Team> {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  logoUrl: string;

  @ForeignKey(() => Coach)
  @Column({ type: DataType.UUID, allowNull: false })
  coachId: string;

  @HasMany(() => Player)
  players: Player[];

   @BelongsTo(() => Coach)
  coach: Coach;
}
