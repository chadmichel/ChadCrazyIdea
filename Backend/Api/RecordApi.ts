import { SqliteDatabaseAccess } from '../Access/SqliteDatabaseAccess';
import { RecordDef } from '../RecordDTOs/RecordDef';
import {
  RecordApiResponse,
  RecordDefApiResponse,
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

  public async createRecordDev(
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
}
