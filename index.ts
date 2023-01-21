import express from 'express';
import bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import winston, { format } from 'winston';
import { SimpleConsoleTransport } from './SimpleConsoleTransport';
import passport from 'passport';
import { v4 as uuidv4 } from 'uuid';
import { Hosting } from './Hosting';
import fs from 'fs';
import { SqliteDatabaseAccess } from './Access/SqliteDatabaseAccess';
import { ApiHandler } from './ApiHandler';
import { DatabaseApi } from './Api/DatabaseApi';

// rest of the code remains same
const app = express();
const PORT = 8000;

dotenv.config();
const logPath = Hosting.logPath;
console.log('LogPath =' + logPath);

const logger = winston.createLogger({
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.printf(
      (info) =>
        `${info.timestamp} ${info.level}: ${info.message}` +
        (info.splat !== undefined ? `${info.splat}` : ' ')
    )
  ),
  transports: [
    new SimpleConsoleTransport(),
    new winston.transports.File({
      filename: logPath + '/log.log',
      level: 'info',
    }),
  ],
});

function errorHandler(err: any, req: any, res: any, next: any) {
  if (res.headersSent) {
    return next(err);
  }
  logger.error(err);
  res.status(500);
  res.render('unhandled  error', { error: err });
}

ApiHandler.db = new SqliteDatabaseAccess(logger);
ApiHandler.Logger = logger;
ApiHandler.app = app;

var api = new ApiHandler();

app.use(bodyParser.json());
app.use(errorHandler);

app.get('/', (req, res) => res.send('ChadCrazyIdea: ' + Hosting.environment));

// Return all databases
// app.get('/dbs', async (req, res) => {
//   logger.info('/dbs');

//   var dbs = await TenantHelper.listTenants();
//   var response = '';
//   for (var item of dbs) {
//     response += item + '<br />  ';
//   }
//   res.send(response);
// });

// list all files in db directory
app.get('/db', async (req, res) => {
  logger.info('/db');

  const filenames = fs.readdirSync('dbs');
  var files = filenames.filter((filename) => filename.endsWith('.db'));
  var response = '';
  for (var item of files) {
    response += item + '<br />  ';
  }
  res.send(response);
});

// open or create a database file
app.get('/db/:name', async (req, res) => {
  logger.info('/db/' + req.params.name);

  await ApiHandler.db.openOrCreate(req.params.name);
  res.send('db opened');
});

api.post('/v1/db/tablesdef', DatabaseApi, 'createTable');
api.post('/v1/db/tablesdef/:table/index', DatabaseApi, 'createIndex');
api.get('/v1/db/tablesdef', DatabaseApi, 'listTables');
api.get('/v1/db/tablesdef/:table', DatabaseApi, 'getTableDef');
api.get('/v1/db/tablesdef/:table/new', DatabaseApi, 'newRow');

api.get('/v1/db/tables/:table', DatabaseApi, 'rows');
api.get('/v1/db/tables/:table/:id', DatabaseApi, 'getRow');
api.post('/v1/db/tables/:table', DatabaseApi, 'insertRow');
api.put('/v1/db/tables/:table/:id', DatabaseApi, 'updateRow');

api.post('/db/searchdef', DatabaseApi, 'createSearchTable');

api.get('/db/searchtables/:table', DatabaseApi, 'searchRows');
api.get('/db/searchtables/:table/:id', DatabaseApi, 'getSearchRow');
api.post('/db/searchtables/:table', DatabaseApi, 'insertSearchRow');
api.put('/db/searchtables/:table/:id', DatabaseApi, 'updateSearchRow');

// api.get('/db/:name/searchdef', DatabaseApi, 'listTables');
// api.get('/db/:name/searchdef/:table', DatabaseApi, 'getTableDef');

app.listen(PORT, () => {
  logger.info(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});
