import { stage } from '@lskjs/env';
import { log as globalLog } from '@lskjs/log/log';
import { map } from 'fishbird';

import { getMessageType } from '../commands/onChatIdCommand';
import { getBotLogger } from './utils/getBotLogger';
import { getInfoFromCtx } from './utils/getInfoFromCtx';

const isDebug = stage === 'isuvorov';
// async function saveOutMiddleware(ctx, next, { method, raw, args, res, i }) {

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function loggerOutMiddleware(ctx, next) {
  if (!ctx.botInfo) {
    if (ctx?.callApiOptions?.method === 'getMe') return;
    globalLog.warn('!!!ctx.botInfo', ctx.botInfo);
    globalLog.warn('!!!ctx?', ctx);
    return;
  }
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
    await next();
    return;
  }

  const { action, user, chat, chatType } = getInfoFromCtx(ctx);
  const { text } = message;
  const userOrUserId = user; // || args[0];
  const messageType = getMessageType(message || {});
  const str = [
    method !== 'sendMessage' ? method : '',
    '=>',
    action !== 'message' ? `${action} ` : '',
    `[${userOrUserId}]`,
    chat && chatType !== 'private' ? `(${chat})` : '',
    messageType,
    text,
  ]
    .filter(Boolean)
    .join(' ');
  // console.log('messageType', messageType, str);
  log.debug(str);
  await next();
}
