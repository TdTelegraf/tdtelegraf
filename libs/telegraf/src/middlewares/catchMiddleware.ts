import { log } from '../utils/log';

export const catchMiddleware =
  (middleware: any, errRes = null) =>
  async (ctx: any, next: any) => {
    let res;
    try {
      res = await middleware(ctx, next);
      return res;
    } catch (err: any) {
      log.error('createIgnoreMiddleware', err);
      if (err?.stack) log.debug(err?.stack);
      if (errRes) return errRes;
      throw err;
    }
  };
