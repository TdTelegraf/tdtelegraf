import { getBotLogger } from './utils/getBotLogger';
import { getInfoFromCtx } from './utils/getInfoFromCtx';

export const loggerMiddleware = (ctx, next) => {
  const log = getBotLogger(ctx.botInfo);
  const { user, chat, chatType, action, text, messageType } = getInfoFromCtx(ctx);
  log.debug(
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
