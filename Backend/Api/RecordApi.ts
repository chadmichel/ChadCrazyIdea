import { SqliteDatabaseAccess } from '../Access/SqliteDatabaseAccess';
import { RecordDef } from '../RecordDTOs/RecordDef';
import {
  RecordApiPageResponse,
  RecordApiResponse,
  RecordDefApiResponse,
  RecordResourceApiResponse,
} from '../RecordDTOs/RecordResponses';
import { BaseApi } from './BaseApi';

export class RecordApi extends BaseApi {
  constructor(
    app: any,
    context: any,
    logger: any,
    security: any,
    db: SqliteDatabaseAccess
  ) {
    super(app, context, logger, security, db);
  }

  public getTenant(req: any) {
    return req.headers.tenant;
  }

  public async createRecordDef(
    req: any,
    res: any
  ): Promise<RecordDefApiResponse> {
    var tableDef = req.body as RecordDef;
    var tenant = this.getTenant(req);

    this.logger.info('/db/records');
    await this.db.createTable(tenant, tableDef);
    return {
      status: 200,
      message: 'OK',
      definition: tableDef,
      link: req.originalUrl,
      dataLink: `/db/records/${tableDef.name}`,
    };
  }

  public async getRecordDef(req: any, res: any): Promise<RecordDefApiResponse> {
    var tenant = this.getTenant(req);
    var recordDef = await this.db.getMetadata(tenant, req.params.table);
    return {
      status: 200,
      message: 'OK',
      definition: recordDef,
      link: req.originalUrl,
      dataLink: `/db/records/${recordDef.name}`,
    };
  }

  public async listRecordDefs(req: any, res: any): Promise<RecordApiResponse> {
    var tenant = this.getTenant(req);
    var tables = await this.db.listMetadataDefsByType(tenant, 'record');
    var list = [];

    for (var item of tables) {
      list.push({
        name: item,
        tableDefLink: `/db/recorddef/${item.name}`,
        dataLink: `/db/records/${item.name}/?page=0`,
      });
    }
    return {
      status: 200,
      message: 'OK',
      data: list,
      link: req.originalUrl,
    };
  }

  public async newRecord(
    req: any,
    res: any
  ): Promise<RecordResourceApiResponse> {
    var tenant = this.getTenant(req);
    var row = await this.db.newRow(tenant, req.params.table);
    if (row == null) {
      return {
        status: 404,
        message: 'Not Found',
        link: req.originalUrl,
        id: req.params.id,
        data: {},
      };
    }
    return {
      status: 200,
      message: 'OK',
      data: row,
      link: req.originalUrl.replace('/new', ''),
      id: '',
    };
  }

  public async records(req: any, res: any): Promise<RecordApiPageResponse> {
    var tenant = this.getTenant(req);
    let pageSize = 100;
    this.logger.info(
      req.originalUrl + ' page=' + req.params.page + ' pageSize=' + pageSize
    );

    var data = await this.db.pageRows(
      tenant,
      req.params.recordDefName,
      req.query.page,
      pageSize,
      req.query.sortby
    );
    var nextPage = parseInt(req.query.page) + 1;
    var prevPage = parseInt(req.query.page) - 1;
    return {
      status: 200,
      message: 'OK',
      data: data.items,
      link: req.originalUrl,
      nextLink:
        data.items.length < pageSize
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
      pageRows: data.items.length,
      pageSize: pageSize,
      totalRows: data.recordCount,
      totalPages: Math.round(data.recordCount / pageSize + 0.5),
    };
  }

  public async insertRecord(
    req: any,
    res: any
  ): Promise<RecordResourceApiResponse> {
    var tenant = this.getTenant(req);
    var id = await this.db.insertRow(
      tenant,
      req.params.recordDefName,
      req.body
    );
    var row = await this.db.getRow(tenant, req.params.recordDefName, id);
    return {
      status: 200,
      message: 'OK',
      data: row,
      link: req.originalUrl + id,
      id: id,
    };
  }

  public async updateRecord(
    req: any,
    res: any
  ): Promise<RecordResourceApiResponse> {
    var tenant = this.getTenant(req);
    var id = await this.db.upsertRow(
      tenant,
      req.params.recordDefName,
      req.params.id,
      req.body
    );
    var row = await this.db.getRow(
      tenant,
      req.params.recordDefName,
      req.params.id
    );
    return {
      status: 200,
      message: 'OK',
      data: row,
      link: req.originalUrl,
      id: id,
    };
  }

  public async getRecord(
    req: any,
    res: any
  ): Promise<RecordResourceApiResponse> {
    var tenant = this.getTenant(req);
    var row = await this.db.getRow(
      tenant,
      req.params.recordDefName,
      req.params.id
    );
    if (row == null) {
      return {
        status: 404,
        message: 'Not Found',
        link: req.originalUrl,
        id: req.params.id,
        data: {},
      };
    }
    return {
      status: 200,
      message: 'OK',
      data: row,
      link: req.originalUrl,
      id: req.params.id,
    };
  }
}
