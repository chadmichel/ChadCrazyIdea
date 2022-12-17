export interface ColumnDef {
  name: string;
  type: string;
  notNull: boolean;
  primaryKey: boolean;
  autoIncrement: boolean;
  defaultValue: string;
}
