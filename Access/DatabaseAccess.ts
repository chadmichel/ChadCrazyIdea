import fs from 'fs';
import { Database } from 'sqlite3';
import { Logger } from 'winston';
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
            resolve(rows);
          }
        }
      );
      db.close();
    });
    return promise;
  }

  static async listColumns(dbName: string, tableName: string) {
    var promise = new Promise(function (resolve, reject) {
      var db = DatabaseHelper.openDb(dbName);
      db.all('PRAGMA table_info(' + tableName + ')', (err, rows) => {
        if (err) {
          DatabaseHelper.Logger.error(err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
      db.close();
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

  static async execSQL(path: string, command: string) {
    var finalPath = DatabaseHelper.path + '/' + path;
    var promise = new Promise(function (resolve, reject) {
      var db = new Database(finalPath);
      DatabaseHelper.Logger.info(
        'Running script db=' + finalPath + ' sql=' + command
      );
      db.exec(command, (err) => {
        if (err) {
          DatabaseHelper.Logger.error(err);
          reject(err);
        } else {
          resolve(null);
        }
      });
      db.close();
    });
    return promise;
  }

  static async upsertWithParams(path: string, command: string, params: any) {
    var finalPath = DatabaseHelper.path + '/' + path;
    var promise = new Promise(function (resolve, reject) {
      var db = new Database(finalPath);
      DatabaseHelper.Logger.info(
        'Running script db=' + finalPath + ' sql=' + command
      );
      db.run(command, params, (err) => {
        if (err) {
          DatabaseHelper.Logger.error(err);
          reject(err);
        } else {
          resolve(null);
        }
      });
      db.close();
    });
    return promise;
  }

  static async query<T>(
    path: string,
    command: string,
    params: any
  ): Promise<T> {
    var finalPath = DatabaseHelper.path + '/' + path;
    var promise = new Promise<T>(function (resolve, reject) {
      var db = new Database(finalPath);
      DatabaseHelper.Logger.info(
        'Running script db=' + finalPath + ' sql=' + command
      );
      db.each(command, params, (err, row) => {
        if (err) {
          DatabaseHelper.Logger.error(err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
    return promise;
  }
}

interface DatabasePageResult {
  recordCount: number;
  rows: any[];
}
