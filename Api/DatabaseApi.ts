import { TableDef } from '../DatabaseDTOs/TableDef';
import { DatabaseHelper } from '../Access/DatabaseAccess';
import { BaseApi } from './BaseApi';

export class DatabaseApi extends BaseApi {
  constructor(app: any, context: any, logger: any, security: any) {
    super(app, context, logger, security);
  }

  public async createTable(req: any, res: any) {
    var tableDef = req.body as TableDef;
    this.logger.info('/db/' + req.params.name + '/tables');
    return await DatabaseHelper.createTable(req.params.name, tableDef);
  }

  public async listTables(req: any, res: any) {
    var tables = await DatabaseHelper.listTables(req.params.name);
    return tables;
  }

  public async listColumns(req: any, res: any) {
    var columns = await DatabaseHelper.listColumns(
      req.params.name,
      req.params.table
    );
    return columns;
  }

  public async rows(req: any, res: any): Promise<DatabaseApiPageResponse> {
    let pageSize = 100;
    this.logger.info(
      `/db/${req.params.name}/tables/${req.params.table}/?page=${req.query.page}`
    );

    var data = await DatabaseHelper.pageRows(
      req.params.name,
      req.params.table,
      req.query.page,
      pageSize
    );
    var nextPage = parseInt(req.params.page) + 1;
    var prevPage = parseInt(req.params.page) - 1;
    return {
      status: 200,
      message: 'OK',
      data: data.rows,
      link: req.originalUrl,
      nextLink:
        data.rows.length < pageSize
          ? ''
          : req.originalUrl.replace(
              'page=' + req.params.page,
              'page=' + nextPage
            ),
      previousLink:
        prevPage < 0
          ? ''
          : req.originalUrl.replace(
              'page=' + req.params.page,
              'page=' + prevPage
            ),
      page: req.query.page,
      pageRows: data.rows.length,
      pageSize: pageSize,
      totalRows: data.recordCount,
      totalPages: Math.round(data.recordCount / pageSize + 0.5),
    };
  }

  public async insertRow(req: any, res: any): Promise<DatabaseApiResponse> {
    var id = await DatabaseHelper.insertRow(
      req.params.name,
      req.params.table,
      req.body
    );
    var row = await DatabaseHelper.getRow(
      req.params.name,
      req.params.table,
      id
    );
    return {
      status: 200,
      message: 'OK',
      data: row,
      link: req.originalUrl + '/' + id,
    };
  }

  public async updateRow(req: any, res: any): Promise<DatabaseApiResponse> {
    var id = await DatabaseHelper.updateRow(
      req.params.name,
      req.params.table,
      req.params.id,
      req.body
    );
    var row = await DatabaseHelper.getRow(
      req.params.name,
      req.params.table,
      id
    );
    return {
      status: 200,
      message: 'OK',
      data: row,
      link: req.originalUrl,
    };
  }

  public async getRow(req: any, res: any) {
    var row = await DatabaseHelper.getRow(
      req.params.name,
      req.params.table,
      req.params.id
    );
    return {
      status: 200,
      message: 'OK',
      data: row,
      link: req.originalUrl,
    };
  }
}

interface DatabaseApiResponse {
  status: number | undefined;
  message: string | undefined;
  data: any;
  link: string | undefined;
}

interface DatabaseApiPageResponse {
  status: number | undefined;
  message: string | undefined;
  data: any;
  link: string | undefined;
  nextLink: string | undefined;
  previousLink: string | undefined;
  page: number | undefined;
  pageRows: number | undefined;
  pageSize: number | undefined;
  totalRows: number | undefined;
  totalPages: number | undefined;
}
