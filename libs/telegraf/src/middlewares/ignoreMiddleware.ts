export const createIgnoreMiddleware = ({ startDate = new Date() } = {}) =>
  async function ignoreMiddleware(ctx: any, next: any) {
    if (!ctx.message) return next();
    if (startDate > new Date(ctx.message.date * 1000)) return false;
    return next();
  };

export const ignoreMiddleware = createIgnoreMiddleware();
