import { ColumnDefinition } from 'better-sqlite3';
import fs from 'fs';
import { Database } from 'sqlite3';
import { Logger } from 'winston';
import { ColumnDef } from '../DatabaseDTOs/ColumnDef';
import { IndexDef } from '../DatabaseDTOs/IndexDef';
import { SearchTableDef } from '../DatabaseDTOs/SearchTableDef';
import { TableDef } from '../DatabaseDTOs/TableDef';
import { v4 as uuidv4 } from 'uuid';

export interface IDatabaseAccess {
  //#region "Table Definition"

  createMetadataTable(dbName: string): Promise<any>;
  upsertMetadata(dbName: string, table: TableDef): Promise<any>;
  getMetadata(dbName: string, tableName: string): Promise<TableDef>;
  listTableDefs(dbName: string): Promise<TableDef[]>;

  createTable(dbName: string, table: TableDef): Promise<any>;
  listTables(dbName: string): Promise<string[]>;

  newRow(dbName: string, tableName: string): any;
  //#endregion "Table Definition"

  //#region "CRUD"

  insertRow(dbName: string, tableName: string, row: any): Promise<string>;

  upsertRow(
    dbName: string,
    tableName: string,
    id: string,
    row: any
  ): Promise<string>;

  getRow(dbName: string, tableName: string, id: string): Promise<any>;

  pageRows(
    dbName: string,
    tableName: string,
    page: number,
    pageSize: number,
    sortBy: string
  ): Promise<DatabasePageResult>;

  //#endregion "CRUD"

  //#region "Search"

  createSearchTable(
    dbName: string,
    searchTableDef: TableDef
  ): Promise<TableDef>;

  pageSearchRows(
    dbName: string,
    tableName: string,
    page: number,
    pageSize: number,
    searchTerm: string,
    sortBy: string
  ): Promise<DatabasePageResult>;

  //#endregion "Search"
}

interface DatabasePageResult {
  recordCount: number;
  items: any[];
}

interface DatabasePageItem {
  id: string;
  data: any;
}
