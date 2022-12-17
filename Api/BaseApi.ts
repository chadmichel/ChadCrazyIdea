import { Logger } from 'winston';
import { AmbientContext } from '../AmbientContext';
import { Express } from 'express';
import { Security } from '../Security';

export class BaseApi {
  constructor(
    protected app: Express,
    protected context: AmbientContext,
    protected logger: Logger,
    protected security: Security
  ) {}
}
