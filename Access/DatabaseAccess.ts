import { ColumnDefinition } from 'better-sqlite3';
import fs from 'fs';
import { Database } from 'sqlite3';
import { Logger } from 'winston';
import { ColumnDef } from '../DatabaseDTOs/ColumnDef';
import { IndexDef } from '../DatabaseDTOs/IndexDef';
import { SearchTableDef } from '../DatabaseDTOs/SearchTableDef';
import { TableDef } from '../DatabaseDTOs/TableDef';

export class DatabaseHelper {
  static path = '/Users/chadmichel/Personal/ChadCrazyIdea/dbs';

  static Logger: Logger;

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

  static async createTable(dbName: string, table: TableDef) {
    var promise = new Promise(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
      var sql = 'CREATE TABLE IF NOT EXISTS ' + table.name + ' (';
      for (var column of table.columns) {
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

  static async getTableDef(
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
            columns: columns,
          };
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
    pageSize: number = 100
  ): Promise<DatabasePageResult> {
    var promise = new Promise<DatabasePageResult>(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
      var sql =
        'SELECT * FROM ' + tableName + ' LIMIT 100 OFFSET ' + page * pageSize;
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
              resolve({
                recordCount: count.cnt,
                rows: rows,
              });
            }
          });
        }
      });
      db.close();
    });
    return promise;
  }

  static async getRow(dbName: string, tableName: string, id: number) {
    var promise = new Promise(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
      var sql = 'SELECT * FROM ' + tableName + ' WHERE id = ?';
      db.get(sql, [id], (err, row) => {
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

  static async insertRow(
    dbName: string,
    tableName: string,
    row: any
  ): Promise<number> {
    var promise = new Promise<number>(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
      var sql = 'INSERT INTO ' + tableName + ' (';
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
      sql += ' RETURNING id';
      DatabaseHelper.Logger.info(sql);
      db.get(sql, params, (err, row) => {
        if (err) {
          DatabaseHelper.Logger.error(err);
          reject(err);
        } else {
          resolve(row.id);
        }
      });
      db.close();
    });
    return promise;
  }

  static async updateRow(
    dbName: string,
    tableName: string,
    id: number,
    row: any
  ): Promise<number> {
    var promise = new Promise<number>(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
      var sql = 'UPDATE ' + tableName + ' SET ';
      var params = [];
      for (var key in row) {
        sql += key + ' = ?, ';
        params.push(row[key]);
      }
      sql = sql.slice(0, -2);
      sql += ' WHERE id = ?';
      params.push(id);
      DatabaseHelper.Logger.info(sql);
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
    searchTableDef: SearchTableDef
  ) {
    var promise = new Promise(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
      var sql =
        'CREATE VIRTUAL TABLE IF NOT EXISTS ' +
        searchTableDef.name +
        '_search USING fts5(';
      for (var column of searchTableDef.columns) {
        if (column.indexed) {
          sql += column.name + ', ';
        } else {
          sql += column.name + ' UNINDEXED, ';
        }
      }
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
    searchTerm: string = ''
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
                rows: rows,
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
  rows: any[];
}
