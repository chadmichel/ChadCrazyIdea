import { Logger } from 'winston';
import { Express } from 'express';
import { BaseApi } from './Api/BaseApi';
import { AmbientContext } from './AmbientContext';
import { Security } from './Security';
import { SqliteDatabaseAccess } from './Access/SqliteDatabaseAccess';

export class ApiHandler {
  static Logger: Logger;
  static app: Express;

  static db: SqliteDatabaseAccess;

  public async post(
    route: string,
    serviceType: typeof BaseApi,
    serviceAction: string,
    allowPublic: boolean = false
  ) {
    ApiHandler.Logger.info(`POST SETUP ${route} ${serviceAction}`);

    ApiHandler.app.post(route, async (req, res) => {
      ApiHandler.Logger.info(
        `BEGIN POST  ${route} ${serviceAction} ${req.body}`
      );
      try {
        var context = new AmbientContext();
        var security = new Security();

        const service = new serviceType(
          ApiHandler.app,
          context,
          ApiHandler.Logger,
          security,
          ApiHandler.db
        ) as any;

        const result = await service[serviceAction](req, res);
        res.send(result);
      } catch (err) {
        ApiHandler.Logger.error(err);
        res.status(500);
        res.send({ error: err });
      }
      ApiHandler.Logger.info(`END POST  ${route} ${serviceAction}`);
    });
  }

  public async put(
    route: string,
    serviceType: typeof BaseApi,
    serviceAction: string,
    allowPublic: boolean = false
  ) {
    ApiHandler.Logger.info(`PUT SETUP ${route} ${serviceAction}`);

    ApiHandler.app.put(route, async (req, res) => {
      ApiHandler.Logger.info(`PUT POST  ${route} ${serviceAction} ${req.body}`);
      try {
        var context = new AmbientContext();
        var security = new Security();

        const service = new serviceType(
          ApiHandler.app,
          context,
          ApiHandler.Logger,
          security,
          ApiHandler.db
        ) as any;
        const result = await service[serviceAction](req, res);
        res.send(result);
      } catch (err) {
        ApiHandler.Logger.error(err);
        res.status(500);
        res.send({ error: err });
      }
      ApiHandler.Logger.info(`END PUT  ${route} ${serviceAction}`);
    });
  }

  public async get(
    route: string,
    serviceType: typeof BaseApi,
    serviceAction: string,
    allowPublic: boolean = false
  ) {
    ApiHandler.Logger.info(`GET SETUP ${route} ${serviceAction}`);

    ApiHandler.app.get(route, async (req, res) => {
      ApiHandler.Logger.info(
        `BEGIN GET  ${route} ${serviceAction} ${req.body}`
      );
      try {
        var context = new AmbientContext();
        var security = new Security();

        const service = new serviceType(
          ApiHandler.app,
          context,
          ApiHandler.Logger,
          security,
          ApiHandler.db
        ) as any;
        const result = await service[serviceAction](req, res);
        res.send(result);
      } catch (err) {
        ApiHandler.Logger.error(err);
        res.status(500);
        res.send({ error: err });
      }
      ApiHandler.Logger.info(`END GET  ${route} ${serviceAction}`);
    });
  }
}
