import { stage } from '@lsk4/env';
import { map } from 'fishbird';

import { log as globalLog } from '../utils/log';
import { loggerMiddleware } from '.';
import { getBotLogger } from './utils/getBotLogger';

const isDebug = stage === 'isuvorov';
// async function saveOutMiddleware(ctx, next, { method, raw, args, res, i }) {
const mutedMethods = ['getMe', 'getUpdates', 'deleteWebhook'];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function loggerOutMiddleware(ctx: any, next: any) {
  // if (ctx.loggerOutMiddleware) return next(); // NOTE: вырубить когда никита починит

  if (mutedMethods.includes(ctx?.callApiOptions?.method)) return next();

  // const ignoreMethods = ['sendMessage', 'updateNewMessage', 'sendMediaGroup', 'sendChatAction'];
  // if (isDebug && !ignoreMethods.includes(ctx?.callApiOptions?.method)) {
  //   console.log('ctx?.callApiOptions', ctx?.callApiOptions);
  // }
  if (!ctx.botInfo) {
    globalLog.warn('!!!ctx.botInfo', ctx.botInfo);
    globalLog.warn('!!!ctx?', ctx);
    return next();
  }

  return loggerMiddleware(ctx, next);

  const log = getBotLogger(ctx.botInfo);
  const { method, payload, res, subRes } = ctx?.callApiOptions || {};
  const message = subRes || res;
  if (isDebug) log.trace(`[${method}]`, payload, message);
  if (Array.isArray(message)) {
    await map(
      message,
      (newSubRes, number) =>
        new Promise((resolve) => {
          loggerOutMiddleware(
            {
              ...ctx,
              callApiOptions: { method, payload, res, subRes: newSubRes, i: number },
            },
            resolve,
          );
        }),
    );
    return next();
  }

  // ctx.loggerOutMiddleware = true; // NOTE: вырубить когда никита починит
  return loggerMiddleware(ctx, next);
  // return next();
}
