import { inspect } from 'util';

export function handleError(func) {
  return (req, res) => {
    func(req, res).catch((err) => {
      console.log('Error', req.originalUrl, inspect(err, { depth: null }));
      res.status(500);
      res.send({ status: 'error', reason: 'internal-error' });
    });
  };
}
