import { Request, Response, NextFunction } from 'express';

async function middleware(
  err,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log('ERROR', err);
  res.status(500).send({ status: 'error', reason: 'internal-error' });
}

export default middleware;
