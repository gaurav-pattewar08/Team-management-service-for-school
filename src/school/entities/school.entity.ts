import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'schools', timestamps: true })
export class School extends Model<School> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare city: string;
}
