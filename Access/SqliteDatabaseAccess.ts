import { ColumnDefinition } from 'better-sqlite3';
import fs from 'fs';
import { Database } from 'sqlite3';
import { Logger } from 'winston';
import { ColumnDef } from '../DatabaseDTOs/ColumnDef';
import { IndexDef } from '../DatabaseDTOs/IndexDef';
import { SearchTableDef } from '../DatabaseDTOs/SearchTableDef';
import { TableDef } from '../DatabaseDTOs/TableDef';
import { v4 as uuidv4 } from 'uuid';

export class SqliteDatabaseAccess {
  static path = '/Users/chadmichel/Personal/ChadCrazyIdea/dbs';

  static systemColumns: ColumnDef[] = [
    {
      name: 'id',
      type: 'Text',
      notNull: true,
      primaryKey: true,
      autoIncrement: false,
      defaultValue: '',
    },
    {
      name: 'extra',
      type: 'Text',
      notNull: false,
      primaryKey: false,
      autoIncrement: false,
      defaultValue: '',
    },
    {
      name: 'createdAt',

      type: 'Text',
      notNull: false,
      primaryKey: false,
      autoIncrement: false,
      defaultValue: '',
    },
    {
      name: 'updatedAt',
      type: 'Text',
      notNull: false,
      primaryKey: false,
      autoIncrement: false,
      defaultValue: '',
    },
  ];

  constructor(private logger: Logger) {}

  dbName(name: string) {
    return SqliteDatabaseAccess.path + '/' + name + '.db';
  }

  openDb(name: string) {
    var path = this.dbName(name);
    this.logger.info('Opening database: ' + path);
    var db = new Database(path);
    return db;
  }

  openOrCreate(dbName: string) {
    var promise = new Promise((resolve, reject) => {
      var db = this.openDb(dbName);
      db.close();
      resolve(null);
    });
    return promise;
  }

  createMetadataTable(dbName: string) {
    var promise = new Promise((resolve, reject) => {
      var db = this.openDb(dbName);
      var sql =
        'CREATE TABLE IF NOT EXISTS meta (name TEXT PRIMARY KEY, type TEXT, columns Text, indexes Text)';
      this.logger.info(sql);
      db.run(sql, (err) => {
        if (err) {
          this.logger.error(err);
          reject(err);
        } else {
          resolve(null);
        }
      });
    });
    return promise;
  }

  async upsertMetadata(dbName: string, table: TableDef) {
    var promise = new Promise((resolve, reject) => {
      this.createMetadataTable(dbName).then(() => {
        var db = this.openDb(dbName);
        var sql =
          'INSERT INTO meta (name, type, columns, indexes)' +
          ' VALUES (?, ?, ?, ?) ON CONFLICT(name)' +
          ' DO UPDATE SET type = ?, columns = ?, indexes = ?';
        this.logger.info(sql);
        var params = [];
        // insert
        params.push(table.name);
        params.push(table.type);
        params.push(JSON.stringify(table.columns));
        params.push(JSON.stringify(table.indexes));
        // update
        params.push(table.type);
        params.push(JSON.stringify(table.columns));
        params.push(JSON.stringify(table.indexes));

        db.run(sql, params, (err) => {
          if (err) {
            this.logger.error(err);
            reject(err);
          } else {
            resolve(null);
          }
        });
      });
    });
    return promise;
  }

  async getMetadata(dbName: string, tableName: string): Promise<TableDef> {
    var promise = new Promise<TableDef>((resolve, reject) => {
      var db = this.openDb(dbName);
      var sql = 'SELECT * FROM meta where name = ?';
      this.logger.info(sql);
      var params = [];
      params.push(tableName);
      db.all(sql, params, (err, rows) => {
        if (err) {
          this.logger.error(err);
          reject(err);
        } else {
          if (rows.length == 0) {
            reject(`Table ${tableName} not found`);
          } else {
            var row = rows[0];
            var table: TableDef = {
              name: row.name,
              type: row.type,
              columns: JSON.parse(row.columns),
              indexes: JSON.parse(row.indexes),
            };
            resolve(table);
          }
        }
      });
    });
    return promise;
  }

  createColumnsArray(): ColumnDef[] {
    var columns: ColumnDef[] = [];
    columns.push({
      name: 'id',
      type: 'Text',
      notNull: true,
      primaryKey: true,
      autoIncrement: false,
      defaultValue: '',
      indexed: false,
    });
    columns.push({
      name: 'extra',
      type: 'Text',
      notNull: false,
      primaryKey: false,
      autoIncrement: false,
      defaultValue: '',
      indexed: false,
    });
    columns.push({
      name: 'createdAt',
      type: 'DateTime',
      notNull: true,
      primaryKey: false,
      autoIncrement: false,
      defaultValue: '',
      indexed: false,
    });
    columns.push({
      name: 'updatedAt',
      type: 'DateTime',
      notNull: true,
      primaryKey: false,
      autoIncrement: false,
      defaultValue: '',
      indexed: false,
    });
    return columns;
  }

  async createTable(dbName: string, table: TableDef) {
    var promise = new Promise((resolve, reject) => {
      if (
        table.columns.filter((c) => c.name.toLowerCase() == 'id').length > 0
      ) {
        reject('Primary key is already added.');
        return;
      }
      if (
        table.columns.filter((c) => c.name.toLowerCase() == 'extra').length > 0
      ) {
        reject('Column name "extra" is reserved.');
        return;
      }
      if (
        table.columns.filter((c) => c.name.toLowerCase() == 'createdat')
          .length > 0
      ) {
        reject('Column name "createdat" is reserved.');
        return;
      }
      if (
        table.columns.filter((c) => c.name.toLowerCase() == 'updatedat')
          .length > 0
      ) {
        reject('Column name "updatedat" is reserved.');
        return;
      }

      var columns = this.createColumnsArray();
      for (var column of table.columns) {
        columns.push(column);
      }

      this.upsertMetadata(dbName, table).then(() => {
        var db = this.openDb(dbName);
        var sql = 'CREATE TABLE IF NOT EXISTS ' + table.name + ' (';
        for (var column of columns) {
          sql += column.name + ' ' + column.type;
          if (column.notNull) {
            sql += ' NOT NULL';
          }
          if (column.primaryKey) {
            sql += ' PRIMARY KEY';
          }
          if (column.autoIncrement) {
            sql += ' AUTOINCREMENT';
          }
          if (column.defaultValue) {
            sql += ' DEFAULT ' + column.defaultValue;
          }
          sql += ', ';
        }
        sql = sql.slice(0, -2);
        sql += ')';

        this.logger.info(sql);

        db.exec(sql, (err) => {
          if (err) {
            this.logger.error(err);
            reject(err);
          } else {
            resolve(null);
          }
        });
      });
    });
    return promise;
  }

  async isPrimaryKeyAutoIncrement(
    dbName: string,
    tableName: string
  ): Promise<boolean> {
    var promise = new Promise<boolean>((resolve, reject) => {
      var db = this.openDb(dbName);
      var sql = `SELECT "is-autoincrement" FROM sqlite_master WHERE tbl_name="${tableName}" AND sql LIKE "%AUTOINCREMENT%"`;
      this.logger.info(sql);
      db.all(sql, (err: any, rows: null) => {
        if (err) {
          this.logger.error(err);
          reject(err);
        } else {
          resolve(rows != null);
        }
      });
      db.close();
    });
    return promise;
  }

  async calculateTableDef(
    dbName: string,
    tableName: string
  ): Promise<TableDef> {
    var promise = new Promise<TableDef>((resolve, reject) => {
      var db = this.openDb(dbName);
      db.all('PRAGMA table_info(' + tableName + ')', (err, rows) => {
        if (err) {
          this.logger.error(err);
          reject(err);
        } else {
          var columns = rows.map((row) => {
            var column = {
              name: row.name,
              type: row.type,
              notNull: row.notnull,
              primaryKey: row.pk == 1,
              autoIncrement: false,
              defaultValue: row.dflt_value,
            };
            return column;
          });
          var tableDef = {
            name: tableName,
            type: 'table',
            columns: columns,
            indexes: [],
          };
          if (tableName.indexOf('_record') > 0) {
            tableDef.type = 'record';
          }
          if (tableName.indexOf('_search') > 0) {
            tableDef.type = 'search';
          }
          if (
            columns.length > 0 &&
            columns.filter((c) => c.primaryKey).length > 0
          ) {
            var primaryKey = columns.filter((c) => c.primaryKey)[0];
            this.isPrimaryKeyAutoIncrement(dbName, tableName).then((result) => {
              primaryKey.autoIncrement = true;
              resolve(tableDef);
            });
          } else {
            resolve(tableDef);
          }
        }
      });
      db.close();
    });
    return promise;
  }

  async listTableDefs(dbName: string): Promise<TableDef[]> {
    var promise = new Promise<TableDef[]>((resolve, reject) => {
      var db = this.openDb(dbName);
      var sql = 'SELECT * FROM meta';
      this.logger.info(sql);
      db.all(sql, (err, rows) => {
        if (err) {
          this.logger.error(err);
          reject(err);
        } else {
          var list = rows.map((row) => {
            var tableDef = {
              name: row.name,
              type: row.type,
              columns: JSON.parse(row.columns),
              indexes: JSON.parse(row.indexes),
            };
            return tableDef;
          });
          resolve(list);
        }
      });
    });
    return promise;
  }

  async listTables(dbName: string): Promise<string[]> {
    var promise = new Promise<string[]>((resolve, reject) => {
      var db = this.openDb(dbName);
      db.all(
        'SELECT name FROM sqlite_master WHERE type="table"',
        (err, rows) => {
          if (err) {
            this.logger.error(err);
            reject(err);
          } else {
            var list = rows.map((row) => row.name);
            list = list.filter(
              (x) =>
                x.name != 'meta' &&
                x.name != 'sqlite_sequence' &&
                x.name.indexOf('sqlite_') != 0 &&
                x.name.indexOf('_search') != 0
            );
            resolve(list);
          }
        }
      );
      db.close();
    });
    return promise;
  }

  async createIndex(dbName: string, tableName: string, indexDef: IndexDef) {
    var promise = new Promise((resolve, reject) => {
      var db = this.openDb(dbName);
      var sql =
        'CREATE INDEX IF NOT EXISTS ' +
        indexDef.name +
        ' ON ' +
        tableName +
        ' (';
      for (var column of indexDef.columns) {
        sql += column + ', ';
      }
      sql = sql.slice(0, -2);
      sql += ')';
      this.logger.info(sql);
      db.exec(sql, (err) => {
        if (err) {
          this.logger.error(err);
          reject(err);
        } else {
          resolve(null);
        }
      });
    });
    return promise;
  }

  async pageRows(
    dbName: string,
    tableName: string,
    page: number = 0,
    pageSize: number = 100,
    sortBy: string = 'id'
  ): Promise<DatabasePageResult> {
    var promise = new Promise<DatabasePageResult>((resolve, reject) => {
      var db = this.openDb(dbName);
      var sql =
        'SELECT * FROM ' +
        tableName +
        ' order by ' +
        sortBy +
        ' LIMIT 100 OFFSET ' +
        page * pageSize;
      ``;

      this.logger.info(sql);
      db.all(sql, (err, rows) => {
        if (err) {
          this.logger.error(err);
          reject(err);
        } else {
          db.get('SELECT COUNT(*) as cnt FROM ' + tableName, (err, count) => {
            if (err) {
              this.logger.error(err);
              reject(err);
            } else {
              var items: DatabasePageItem[] = [];

              for (var row of rows) {
                var item: DatabasePageItem = {
                  id: row.id,
                  data: {},
                };
                for (var key in row) {
                  if (
                    SqliteDatabaseAccess.systemColumns.filter(
                      (x) => x.name.toLowerCase() == key.toLowerCase()
                    ).length == 0
                  ) {
                    item.data[key] = row[key];
                  }
                }
                SqliteDatabaseAccess.addExtraColumns(item.data, row.extra);

                items.push(item);
              }
              resolve({
                recordCount: count.cnt,
                items: items,
              });
            }
          });
        }
      });
      db.close();
    });
    return promise;
  }

  async newRow(dbName: string, tableName: string) {
    var tableDef = await this.getMetadata(dbName, tableName);
    var row: any = {};
    for (var column of tableDef.columns) {
      if (column.type == 'datetime') {
        row[column.name] = new Date();
      }
      if (column.type == 'boolean') {
        row[column.name] = false;
      }
      if (column.type == 'number') {
        row[column.name] = 0;
      }
      if (column.type == 'text') {
        row[column.name] = '';
      }
    }
    return row;
  }

  async getRow(dbName: string, tableName: string, id: string): Promise<any> {
    var tableDef = await this.getMetadata(dbName, tableName);

    var promise = new Promise((resolve, reject) => {
      var db = this.openDb(dbName);
      var sql = 'SELECT * FROM ' + tableName + ' WHERE id = ?';
      this.logger.info(sql);
      db.get(sql, [id], (err, row) => {
        if (err) {
          this.logger.error(err);
          reject(err);
        } else {
          if (row == null) {
            resolve(null);
          } else {
            var result: any = {};

            for (var column of tableDef.columns) {
              if (column.type == 'datetime') {
                result[column.name] = new Date(row[column.name]);
              } else if (column.type == 'number') {
                result[column.name] = Number(row[column.name]);
              } else if (column.type == 'boolean') {
                result[column.name] = row[column.name] == 1;
              } else if (column.type == 'text') {
                result[column.name] = row[column.name];
              } else {
                result[column.name] = row[column.name];
              }
            }
            SqliteDatabaseAccess.addExtraColumns(result, row.extra);
            resolve(result);
          }
        }
      });
      db.close();
    });
    return promise;
  }

  static addExtraColumns(row: any, json: string) {
    var extra = JSON.parse(json);
    for (var extraColumn in extra) {
      if (this.systemColumns.filter((x) => x.name == extraColumn).length == 0) {
        row[extraColumn] = extra[extraColumn];
      }
    }
  }

  async insertRow(
    dbName: string,
    tableName: string,
    row: any
  ): Promise<string> {
    var id = uuidv4();
    return await this.upsertRow(dbName, tableName, id, row);
  }

  async upsertRow(
    dbName: string,
    tableName: string,
    id: string,
    row: any
  ): Promise<string> {
    if (id == null || id == '') {
      id = uuidv4();
    }

    var useUpsert = false;
    var tableDef = await this.getMetadata(dbName, tableName);
    if (tableDef.type == 'search') {
      useUpsert = false;
    }

    var promise = new Promise<string>((resolve, reject) => {
      var db = this.openDb(dbName);
      var sql = 'INSERT INTO ' + tableName + ' (';
      var values = 'VALUES (';
      var updates = ' ON CONFLICT(id) DO UPDATE SET ';
      if (!useUpsert) {
        updates = ' ; UPDATE ' + tableName + ' SET';
      }
      var params = [];
      var updateParams: any[] = [];

      sql += 'id, ';
      values += '?, ';
      params.push(id);

      var writeTime = new Date().getTime();

      sql += 'createdat, ';
      values += '?, ';
      params.push(writeTime);

      sql += 'updatedat, ';
      values += '?, ';
      params.push(writeTime);
      updateParams.push(writeTime);
      updates += ' updatedat = ?, ';

      for (var column of tableDef.columns) {
        sql += column.name + ', ';
        values += '?, ';
        params.push(row[column.name]);
        if (row[column.name] != null) {
          updates += column.name + '= ?, ';
          updateParams.push(row[column.name]);
        }
      }
      var extra: any = {};
      for (var key in row) {
        if (!tableDef.columns.find((x) => x.name == key)) {
          extra[key] = row[key];
        }
      }
      sql += 'extra) ';
      values += '?) ';
      params.push(JSON.stringify(extra));
      if (extra.length > 0) {
        updates += 'extra = ?, ';
        updateParams.push(JSON.stringify(extra));
      }

      sql = sql.slice(0, -2);
      values = values.slice(0, -2);
      updates = updates.slice(0, -2);

      sql += ') ' + values + ')';

      if (useUpsert) {
        sql += updates;

        for (var param of updateParams) {
          params.push(param);
        }
      }

      this.logger.info(sql);

      var rawSql = sql;
      for (var param of params) {
        rawSql = rawSql.replace(/\?/i, param);
      }
      this.logger.info(rawSql);

      db.get(sql, params, (err, row) => {
        if (err) {
          this.logger.error(err);
          reject(err);
        } else {
          if (!useUpsert) {
            updates += ' WHERE id = ?';
            updateParams.push(id);
            this.logger.info(rawSql);
            db.get(updates, updateParams, (err: any, row: any) => {
              if (err) {
                this.logger.error(err);
                reject(err);
              } else {
                resolve(id);
              }
            });
          } else {
            resolve(id);
          }
        }
      });
      db.close();
    });
    return promise;
  }

  async createSearchTable(
    dbName: string,
    searchTableDef: TableDef
  ): Promise<TableDef> {
    searchTableDef.type = 'search';
    await this.upsertMetadata(dbName, searchTableDef);

    var columns = this.createColumnsArray();
    for (var column of searchTableDef.columns) {
      columns.push(column);
    }

    var promise = new Promise<TableDef>((resolve, reject) => {
      var db = this.openDb(dbName);
      var sql =
        'CREATE VIRTUAL TABLE IF NOT EXISTS ' +
        searchTableDef.name +
        ' USING fts5(';
      for (var column of columns) {
        if (column.indexed) {
          sql += column.name + ', ';
        } else {
          sql += column.name + ' UNINDEXED, ';
        }
      }
      sql = sql.slice(0, -2);
      sql += ')';
      this.logger.info(sql);
      db.exec(sql, (err) => {
        if (err) {
          this.logger.error(err);
          reject(err);
        } else {
          searchTableDef.type = 'search';
          resolve(searchTableDef);
        }
      });
    });
    return promise;
  }

  async pageSearchRows(
    dbName: string,
    tableName: string,
    page: number = 0,
    pageSize: number = 100,
    searchTerm: string = '',
    sortBy: string = 'id'
  ): Promise<DatabasePageResult> {
    var promise = new Promise<DatabasePageResult>((resolve, reject) => {
      var db = this.openDb(dbName);
      var params: any[] = [];
      var sql = 'SELECT * FROM ' + tableName;
      if (searchTerm != '' ?? searchTerm.length > 0) {
        sql += ' WHERE ' + tableName + ' MATCH ? ';
        params.push(searchTerm);
      }

      sql += ' order by ' + sortBy;
      sql += ' LIMIT ' + pageSize + ' OFFSET ' + page * pageSize;

      this.logger.info(sql);
      db.all(sql, params, (err, rows) => {
        if (err) {
          this.logger.error(err);
          reject(err);
        } else {
          db.get('SELECT COUNT(*) as cnt FROM ' + tableName, (err, count) => {
            if (err) {
              this.logger.error(err);
              reject(err);
            } else {
              var items: DatabasePageItem[] = [];

              for (var row of rows) {
                var item: DatabasePageItem = {
                  id: row.id,
                  data: {},
                };
                for (var key in row) {
                  if (
                    SqliteDatabaseAccess.systemColumns.filter(
                      (x) => x.name.toLowerCase() == key.toLowerCase()
                    ).length == 0
                  ) {
                    item.data[key] = row[key];
                  }
                }
                SqliteDatabaseAccess.addExtraColumns(item.data, row.extra);

                items.push(item);
              }
              resolve({
                recordCount: count.cnt,
                items: items,
              });
            }
          });
        }
      });
      db.close();
    });
    return promise;
  }
}

interface DatabasePageResult {
  recordCount: number;
  items: any[];
}

interface DatabasePageItem {
  id: string;
  data: any;
}
