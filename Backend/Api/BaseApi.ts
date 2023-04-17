import { Logger } from 'winston';
import { AmbientContext } from '../AmbientContext';
import { Express } from 'express';
import { Security } from '../Security';
import { IDatabaseAccess } from '../Access/IDatabaseAccess';

export class BaseApi {
  constructor(
    protected app: Express,
    protected context: AmbientContext,
    protected logger: Logger,
    protected security: Security,
    protected db: IDatabaseAccess
  ) {}
}
