import { getInfoFromCtx } from './utils/getInfoFromCtx';

export const loggerMiddleware = (ctx, next) => {
  const { log, user, chat, chatType, action, text, messageType } = getInfoFromCtx(ctx);
  log.trace(
    [
      '=>',
      action !== 'message' ? `${action} ` : '',
      `[${user}]`,
      chat && chatType !== 'private' ? `(${chat})` : '',
      messageType,
      text,
    ]
      .filter(Boolean)
      .join(' '),
  );
  return next();
};
