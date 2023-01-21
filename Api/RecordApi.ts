import { SqliteDatabaseAccess } from '../Access/SqliteDatabaseAccess';
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

  
}
