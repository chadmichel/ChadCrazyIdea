import { ColumnDefinition } from 'better-sqlite3';
import fs from 'fs';
import { Database } from 'sqlite3';
import { Logger } from 'winston';
import { ColumnDef } from '../DatabaseDTOs/ColumnDef';
import { IndexDef } from '../DatabaseDTOs/IndexDef';
import { SearchTableDef } from '../DatabaseDTOs/SearchTableDef';
import { TableDef } from '../DatabaseDTOs/TableDef';
import { v4 as uuidv4 } from 'uuid';

export class DatabaseHelper {
  static path = '/Users/chadmichel/Personal/ChadCrazyIdea/dbs';

  static Logger: Logger;

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

  static dbName(name: string) {
    return DatabaseHelper.path + '/' + name + '.db';
  }

  static openDb(name: string) {
    var path = DatabaseHelper.dbName(name);
    DatabaseHelper.Logger.info('Opening database: ' + path);
    var db = new Database(path);
    return db;
  }

  static openOrCreate(dbName: string) {
    var promise = new Promise(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
      db.close();
      resolve(null);
    });
    return promise;
  }

  static async createMetadataTable(dbName: string) {
    var promise = new Promise(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
      var sql =
        'CREATE TABLE IF NOT EXISTS meta (name TEXT PRIMARY KEY, type TEXT, columns Text, indexes Text)';
      DatabaseHelper.Logger.info(sql);
      db.run(sql, (err) => {
        if (err) {
          DatabaseHelper.Logger.error(err);
          reject(err);
        } else {
          resolve(null);
        }
      });
    });
    return promise;
  }

  static async upsertMetadata(dbName: string, table: TableDef) {
    var promise = new Promise(function (resolve, reject) {
      DatabaseHelper.createMetadataTable(dbName).then(() => {
        var db = DatabaseHelper.openDb(dbName);
        var sql =
          'INSERT INTO meta (name, type, columns, indexes)' +
          ' VALUES (?, ?, ?, ?) ON CONFLICT(name)' +
          ' DO UPDATE SET type = ?, columns = ?, indexes = ?';
        DatabaseHelper.Logger.info(sql);
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
            DatabaseHelper.Logger.error(err);
            reject(err);
          } else {
            resolve(null);
          }
        });
      });
    });
    return promise;
  }

  static async getMetadata(
    dbName: string,
    tableName: string
  ): Promise<TableDef> {
    var promise = new Promise<TableDef>(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
      var sql = 'SELECT * FROM meta where name = ?';
      DatabaseHelper.Logger.info(sql);
      var params = [];
      params.push(tableName);
      db.all(sql, params, (err, rows) => {
        if (err) {
          DatabaseHelper.Logger.error(err);
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

  static createColumnsArray(): ColumnDef[] {
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

  static async createTable(dbName: string, table: TableDef) {
    var promise = new Promise(function (resolve, reject) {
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

      var columns = DatabaseHelper.createColumnsArray();
      for (var column of table.columns) {
        columns.push(column);
      }

      DatabaseHelper.upsertMetadata(dbName, table).then(() => {
        var db = DatabaseHelper.openDb(dbName);
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

        DatabaseHelper.Logger.info(sql);

        db.exec(sql, (err) => {
          if (err) {
            DatabaseHelper.Logger.error(err);
            reject(err);
          } else {
            resolve(null);
          }
        });
      });
    });
    return promise;
  }

  static async isPrimaryKeyAutoIncrement(
    dbName: string,
    tableName: string
  ): Promise<boolean> {
    var promise = new Promise<boolean>(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
      var sql = `SELECT "is-autoincrement" FROM sqlite_master WHERE tbl_name="${tableName}" AND sql LIKE "%AUTOINCREMENT%"`;
      DatabaseHelper.Logger.info(sql);
      db.all(sql, (err, rows) => {
        if (err) {
          DatabaseHelper.Logger.error(err);
          reject(err);
        } else {
          resolve(rows != null);
        }
      });
      db.close();
    });
    return promise;
  }

  static async calculateTableDef(
    dbName: string,
    tableName: string
  ): Promise<TableDef> {
    var promise = new Promise<TableDef>(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
      db.all('PRAGMA table_info(' + tableName + ')', (err, rows) => {
        if (err) {
          DatabaseHelper.Logger.error(err);
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
            DatabaseHelper.isPrimaryKeyAutoIncrement(dbName, tableName).then(
              (result) => {
                primaryKey.autoIncrement = true;
                resolve(tableDef);
              }
            );
          } else {
            resolve(tableDef);
          }
        }
      });
      db.close();
    });
    return promise;
  }

  static async listTableDefs(dbName: string): Promise<TableDef[]> {
    var promise = new Promise<TableDef[]>(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
      var sql = 'SELECT * FROM meta';
      DatabaseHelper.Logger.info(sql);
      db.all(sql, (err, rows) => {
        if (err) {
          DatabaseHelper.Logger.error(err);
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

  static async listTables(dbName: string): Promise<string[]> {
    var promise = new Promise<string[]>(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
      db.all(
        'SELECT name FROM sqlite_master WHERE type="table"',
        (err, rows) => {
          if (err) {
            DatabaseHelper.Logger.error(err);
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

  static async createIndex(
    dbName: string,
    tableName: string,
    indexDef: IndexDef
  ) {
    var promise = new Promise(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
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
      DatabaseHelper.Logger.info(sql);
      db.exec(sql, (err) => {
        if (err) {
          DatabaseHelper.Logger.error(err);
          reject(err);
        } else {
          resolve(null);
        }
      });
    });
    return promise;
  }

  static async pageRows(
    dbName: string,
    tableName: string,
    page: number = 0,
    pageSize: number = 100,
    sortBy: string = 'id'
  ): Promise<DatabasePageResult> {
    var promise = new Promise<DatabasePageResult>(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
      var sql =
        'SELECT * FROM ' +
        tableName +
        ' order by ' +
        sortBy +
        ' LIMIT 100 OFFSET ' +
        page * pageSize;

      DatabaseHelper.Logger.info(sql);
      db.all(sql, (err, rows) => {
        if (err) {
          DatabaseHelper.Logger.error(err);
          reject(err);
        } else {
          db.get('SELECT COUNT(*) as cnt FROM ' + tableName, (err, count) => {
            if (err) {
              DatabaseHelper.Logger.error(err);
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
                    DatabaseHelper.systemColumns.filter(
                      (x) => x.name.toLowerCase() == key.toLowerCase()
                    ).length == 0
                  ) {
                    item.data[key] = row[key];
                  }
                }
                DatabaseHelper.addExtraColumns(item.data, row.extra);

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

  static async newRow(dbName: string, tableName: string) {
    var tableDef = await DatabaseHelper.getMetadata(dbName, tableName);
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

  static async getRow(
    dbName: string,
    tableName: string,
    id: string
  ): Promise<any> {
    var tableDef = await DatabaseHelper.getMetadata(dbName, tableName);

    var promise = new Promise(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
      var sql = 'SELECT * FROM ' + tableName + ' WHERE id = ?';
      DatabaseHelper.Logger.info(sql);
      db.get(sql, [id], (err, row) => {
        if (err) {
          DatabaseHelper.Logger.error(err);
          reject(err);
        } else {
          if (row == null) {
            resolve(null);
          } else {
            var result: any = {};

            for (var column of tableDef.columns) {
              if (column.type == 'datetime') {
                result[column.name] = new Date(row[column.name]);
              }
              if (column.type == 'number') {
                result[column.name] = Number(row[column.name]);
              }
              if (column.type == 'boolean') {
                result[column.name] = row[column.name] == 1;
              }
              if (column.type == 'text') {
                result[column.name] = row[column.name];
              }
            }
            // var extra = JSON.parse(row.extra);
            // for (var extraColumn in extra) {
            //   result[extraColumn] = extra[extraColumn];
            // }
            DatabaseHelper.addExtraColumns(result, row.extra);
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
      if (
        DatabaseHelper.systemColumns.filter((x) => x.name == extraColumn)
          .length == 0
      ) {
        row[extraColumn] = extra[extraColumn];
      }
    }
  }

  static async insertRow(
    dbName: string,
    tableName: string,
    row: any
  ): Promise<string> {
    var id = uuidv4();
    return await DatabaseHelper.updateRow(dbName, tableName, id, row);
  }

  static async updateRow(
    dbName: string,
    tableName: string,
    id: string,
    row: any
  ): Promise<string> {
    var tableDef = await DatabaseHelper.getMetadata(dbName, tableName);

    var promise = new Promise<string>(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
      var sql = 'INSERT INTO ' + tableName + ' (';
      var values = 'VALUES (';
      var updates = ' ON CONFLICT(id) DO UPDATE SET ';
      var params = [];
      var updateParams = [];

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
      sql += updates;

      for (var param of updateParams) {
        params.push(param);
      }

      DatabaseHelper.Logger.info(sql);

      var rawSql = sql;
      for (var param of params) {
        rawSql = rawSql.replace(/\?/i, param);
      }
      DatabaseHelper.Logger.info(rawSql);

      db.get(sql, params, (err, row) => {
        if (err) {
          DatabaseHelper.Logger.error(err);
          reject(err);
        } else {
          resolve(id);
        }
      });
      db.close();
    });
    return promise;
  }

  static async createSearchTable(
    dbName: string,
    searchTableDef: TableDef
  ): Promise<TableDef> {
    searchTableDef.type = 'search';
    await DatabaseHelper.upsertMetadata(dbName, searchTableDef);

    var columns = DatabaseHelper.createColumnsArray();
    for (var column of searchTableDef.columns) {
      columns.push(column);
    }

    var promise = new Promise<TableDef>(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
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
      DatabaseHelper.Logger.info(sql);
      db.exec(sql, (err) => {
        if (err) {
          DatabaseHelper.Logger.error(err);
          reject(err);
        } else {
          searchTableDef.type = 'search';
          resolve(searchTableDef);
        }
      });
    });
    return promise;
  }

  public static async insertSearchRow(
    dbName: string,
    searchTableName: string,
    row: any
  ): Promise<void> {
    searchTableName = searchTableName + '_search';
    var promise = new Promise<void>(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
      var sql = 'INSERT INTO ' + searchTableName + ' (';
      var values = 'VALUES (';
      var params = [];
      for (var key in row) {
        sql += key + ', ';
        values += '?, ';
        params.push(row[key]);
      }
      sql = sql.slice(0, -2);
      values = values.slice(0, -2);
      sql += ') ' + values + ')';
      DatabaseHelper.Logger.info(sql);
      db.get(sql, params, (err, row) => {
        if (err) {
          DatabaseHelper.Logger.error(err);
          reject(err);
        } else {
          resolve();
        }
      });
      db.close();
    });
    return promise;
  }

  static async updateSearchRow(
    dbName: string,
    searchTableName: string,
    id: number,
    row: any
  ): Promise<number> {
    searchTableName = searchTableName + '_search';
    var promise = new Promise<number>(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
      var sql = 'UPDATE ' + searchTableName + ' SET ';
      var sql2 = 'UPDATE ' + searchTableName + ' SET ';
      var params = [];
      for (var key in row) {
        sql += key + ' = ?, ';
        sql2 += key + ' = ' + row[key] + ', ';
        params.push(row[key]);
      }
      sql = sql.slice(0, -2);
      sql += ' WHERE id = ?;';
      params.push(id);

      //sql += ' SELECT * FROM ' + searchTableName + ' WHERE id = ?';
      //params.push(id);

      sql2 = sql2.slice(0, -2);
      sql2 += ' WHERE id = ' + id + ';';
      //sql2 += ' SELECT * FROM ' + searchTableName + ' WHERE id = ' + id;

      DatabaseHelper.Logger.info(sql);
      DatabaseHelper.Logger.info(sql2);

      db.all(sql, params, (err, row) => {
        if (err) {
          DatabaseHelper.Logger.error(err);
          reject(err);
        } else {
          resolve(id);
        }
      });
      db.close();
    });
    return promise;
  }

  static async getSearchRow(
    dbName: string,
    searchTableName: string,
    id: number
  ) {
    searchTableName = searchTableName + '_search';
    var promise = new Promise(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
      var sql = 'SELECT * FROM ' + searchTableName + ' WHERE id = ?';
      DatabaseHelper.Logger.info(sql);
      db.all(sql, [id], (err, row) => {
        if (err) {
          DatabaseHelper.Logger.error(err);
          reject(err);
        } else {
          resolve(row);
        }
      });
      db.close();
    });
    return promise;
  }

  static async pageSearchRows(
    dbName: string,
    searchTableName: string,
    page: number = 0,
    pageSize: number = 100,
    searchTerm: string = '',
    sortBy: string = 'id'
  ): Promise<DatabasePageResult> {
    var promise = new Promise<DatabasePageResult>(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
      searchTableName = searchTableName + '_search';
      var sql = 'SELECT * FROM ' + searchTableName;
      var params: any[] = [];

      if (searchTerm != '' ?? searchTerm.length > 0) {
        sql += ' WHERE ' + searchTableName + ' MATCH ?';
        params.push(searchTerm);
      }

      sql += ' ORDER BY ' + sortBy + ' ASC';
      sql += ' LIMIT 100 OFFSET ' + page * pageSize;

      DatabaseHelper.Logger.info(sql);

      db.all(sql, params, (err, rows) => {
        if (err) {
          DatabaseHelper.Logger.error(err);
          reject(err);
        } else {
          var sql2 = 'SELECT COUNT(*) as cnt FROM ' + searchTableName;
          if (searchTerm != '' ?? searchTerm.length > 0) {
            sql2 += ' WHERE ' + searchTableName + ' MATCH ?';
          }
          db.all(sql2, params, (err, count) => {
            if (err) {
              DatabaseHelper.Logger.error(err);
              reject(err);
            } else {
              resolve({
                recordCount: count[0].cnt,
                items: rows,
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
