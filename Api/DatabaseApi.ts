import { TableDef } from '../DatabaseDTOs/TableDef';
import { DatabaseHelper } from '../Access/DatabaseAccess';
import { BaseApi } from './BaseApi';
import { IndexDef } from '../DatabaseDTOs/IndexDef';
import { SearchTableDef } from '../DatabaseDTOs/SearchTableDef';

export class DatabaseApi extends BaseApi {
  constructor(app: any, context: any, logger: any, security: any) {
    super(app, context, logger, security);
  }

  public getTenant(req: any) {
    return req.headers.tenant;
  }

  public async createTable(
    req: any,
    res: any
  ): Promise<DatabaseDefApiResponse> {
    var tableDef = req.body as TableDef;
    var tenant = this.getTenant(req);

    this.logger.info('/db/tables');
    await DatabaseHelper.createTable(tenant, tableDef);
    return {
      status: 200,
      message: 'OK',
      definition: tableDef,
      link: req.originalUrl,
      dataLink: `/db/tables/${tableDef.name}`,
    };
  }

  public async getTableDef(
    req: any,
    res: any
  ): Promise<DatabaseDefApiResponse> {
    var tenant = this.getTenant(req);
    var tableDef = await DatabaseHelper.getMetadata(tenant, req.params.table);
    return {
      status: 200,
      message: 'OK',
      definition: tableDef,
      link: req.originalUrl,
      dataLink: `/db/tables/${tableDef.name}`,
    };
  }

  public async createIndex(
    req: any,
    res: any
  ): Promise<DatabaseMinApiResponse> {
    var indexDef = req.body as IndexDef;
    this.logger.info('/db/' + req.params.name + '/tables');
    await DatabaseHelper.createIndex(
      req.params.name,
      req.params.table,
      indexDef
    );
    return {
      status: 200,
      message: 'OK',
    };
  }

  public async listTables(req: any, res: any): Promise<DatabaseApiResponse> {
    var tenant = this.getTenant(req);
    var tables = await DatabaseHelper.listTableDefs(tenant);
    var list = [];

    for (var item of tables) {
      list.push({
        name: item,
        tableDefLink: `/db/tableDef/${item.name}`,
        dataLink: `/db/tables/${item.name}/?page=0`,
      });
    }
    return {
      status: 200,
      message: 'OK',
      data: list,
      link: req.originalUrl,
    };
  }

  public async rows(req: any, res: any): Promise<DatabaseApiPageResponse> {
    var tenant = this.getTenant(req);
    let pageSize = 100;
    this.logger.info(
      req.originalUrl + ' page=' + req.params.page + ' pageSize=' + pageSize
    );

    var data = await DatabaseHelper.pageRows(
      tenant,
      req.params.table,
      req.query.page,
      pageSize,
      req.query.sortby
    );
    var nextPage = parseInt(req.params.page) + 1;
    var prevPage = parseInt(req.params.page) - 1;
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

  public async insertRow(
    req: any,
    res: any
  ): Promise<DatabaseResourceApiResponse> {
    var tenant = this.getTenant(req);
    var id = await DatabaseHelper.insertRow(tenant, req.params.table, req.body);
    var row = await DatabaseHelper.getRow(tenant, req.params.table, id);
    return {
      status: 200,
      message: 'OK',
      data: row,
      link: req.originalUrl + id,
      id: id,
    };
  }

  public async updateRow(
    req: any,
    res: any
  ): Promise<DatabaseResourceApiResponse> {
    var tenant = this.getTenant(req);
    var id = await DatabaseHelper.upsertRow(
      tenant,
      req.params.table,
      req.params.id,
      req.body
    );
    var row = await DatabaseHelper.getRow(
      tenant,
      req.params.table,
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

  public async getRow(
    req: any,
    res: any
  ): Promise<DatabaseResourceApiResponse> {
    var tenant = this.getTenant(req);
    var row = await DatabaseHelper.getRow(
      tenant,
      req.params.table,
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

  public async newRow(
    req: any,
    res: any
  ): Promise<DatabaseResourceApiResponse> {
    var tenant = this.getTenant(req);
    var row = await DatabaseHelper.newRow(tenant, req.params.table);
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

  public async createSearchTable(
    req: any,
    res: any
  ): Promise<DatabaseDefApiResponse> {
    var tenant = this.getTenant(req);
    var tableDef = req.body as TableDef;

    this.logger.info('/db/searchdef');

    tableDef = await DatabaseHelper.createSearchTable(tenant, tableDef);
    return {
      status: 200,
      message: 'OK',
      definition: tableDef,
      link: req.originalUrl,
      dataLink: `/db/searchtables/${tableDef.name}`,
    };
  }

  public async insertSearchRow(
    req: any,
    res: any
  ): Promise<DatabaseResourceApiResponse> {
    var tenant = this.getTenant(req);
    var id = await DatabaseHelper.upsertRow(
      tenant,
      req.params.table,
      '',
      req.body
    );
    var row = await DatabaseHelper.getRow(tenant, req.params.table, id);
    return {
      status: 200,
      message: 'OK',
      data: row,
      link: req.originalUrl + id,
      id: id,
    };
  }

  public async updateSearchRow(
    req: any,
    res: any
  ): Promise<DatabaseResourceApiResponse> {
    var tenant = this.getTenant(req);
    var id = await DatabaseHelper.upsertRow(
      tenant,
      req.params.table,
      req.params.id,
      req.body
    );
    var row = await DatabaseHelper.getRow(tenant, req.params.table, id);
    return {
      status: 200,
      message: 'OK',
      data: row,
      link: req.originalUrl + id,
      id: id,
    };
  }

  public async getSearchRow(req: any, res: any) {
    var tenant = this.getTenant(req);
    var row = await DatabaseHelper.getRow(
      tenant,
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

  public async searchRows(
    req: any,
    res: any
  ): Promise<DatabaseApiPageResponse> {
    let pageSize = 100;
    this.logger.info(
      `/db/${req.params.name}/searchtables/${req.params.table}/?page=${req.query.page}&search=${req.query.search}&sortBy=${req.query.sortBy}`
    );

    var tenant = this.getTenant(req);

    var data = await DatabaseHelper.pageSearchRows(
      tenant,
      req.params.table,
      req.query.page,
      pageSize,
      req.query.search,
      req.query.sortby
    );
    var nextPage = parseInt(req.params.page) + 1;
    var prevPage = parseInt(req.params.page) - 1;
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
}

interface DatabaseDefApiResponse {
  status: number | undefined;
  message: string | undefined;
  definition: any;
  link: string | undefined;
  dataLink: string | undefined;
}

interface DatabaseMinApiResponse {
  status: number | undefined;
  message: string | undefined;
}

interface DatabaseApiResponse {
  status: number | undefined;
  message: string | undefined;
  data: any;
  link: string | undefined;
}

interface DatabaseResourceApiResponse {
  status: number | undefined;
  message: string | undefined;
  data: any;
  link: string | undefined;
  id: string | undefined;
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
