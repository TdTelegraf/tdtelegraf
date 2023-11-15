import { log } from '@lskjs/log/log';

export const catchMiddleware =
  (middleware, errRes = null) =>
  async (ctx, next) => {
    let res;
    try {
      res = await middleware(ctx, next);
      return res;
    } catch (err) {
      log.error('createIgnoreMiddleware', err);
      log.debug(err.stack);
      if (errRes) return errRes;
      throw err;
    }
  };
