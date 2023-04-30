const config = require('config');

export class Hosting {
  static environment = config.get('environment');
  static rootUrl = config.get('rootUrl');
  static logPath = config.get('logPath');
  static dbBasePath = config.get('dbBasePath');
}
