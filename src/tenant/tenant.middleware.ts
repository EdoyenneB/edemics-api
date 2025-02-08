import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const domain = req.headers['x-tenant-domain']; // Or parse req.hostname
    req['tenantId'] = domain; // Attach to the request
    next();
  }
}
