import { stage } from '@lskjs/env';
import { map } from 'fishbird';

import { getMessageType } from '../commands/onChatIdCommand';
import { getInfoFromCtx } from './utils/getInfoFromCtx';

const isDebug = stage === 'isuvorov';
// async function saveOutMiddleware(ctx, next, { method, raw, args, res, i }) {

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function loggerOutMiddleware(ctx, next) {
  const { method, payload, res, subRes } = ctx?.callApiOptions || {};
  const message = subRes || res;
  if (isDebug) console.log(`[${method}]`, payload, message);
  if (Array.isArray(res)) {
    await map(
      res,
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

  const { log, action, user, chat, chatType } = getInfoFromCtx(ctx);
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
  log.trace(str);
  await next();
}
