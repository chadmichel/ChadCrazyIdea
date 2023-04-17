import { ColumnDef } from './ColumnDef';
import { IndexDef } from './IndexDef';

export interface TableDef {
  name: string;
  type: string;
  columns: ColumnDef[];
  indexes: IndexDef[];
}
