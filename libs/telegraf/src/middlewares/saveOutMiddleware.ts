import { log as globalLog } from '@lskjs/log/log';
import { map } from 'fishbird';

import { omitTrash } from '.';
import { getCtxInfo } from './utils/getCtxInfo';
import { saveServiceMock } from './utils/saveServiceMock';
import { SaveService } from './utils/types';

const mutedMethods = ['getMe', 'getUpdates', 'deleteWebhook'];

export const createSaveOutMiddleware = ({ service }: { service: SaveService }) =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function saveOutMiddleware(ctx, next) {
    if (mutedMethods.includes(ctx?.callApiOptions?.method)) return next();
    if (!ctx.botInfo) {
      globalLog.warn('!!!ctx.botInfo', ctx.botInfo);
      globalLog.warn('!!!ctx?', ctx);
      return next();
    }
    const { method, payload, res, subRes } = ctx?.callApiOptions || {};
    const message = subRes || res;
    if (Array.isArray(message)) {
      await map(
        message,
        (newSubRes, number) =>
          new Promise((resolve) => {
            saveOutMiddleware(
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
    const { messageClass } = getCtxInfo(ctx);
    if (messageClass !== 'message') return next();
    const botId = ctx?.botInfo?.id;
    const chatId = message?.chat?.id;
    const messageId = message?.message_id;

    if (!botId) {
      globalLog.error('createSaveOutMiddleware FIX: this !botId', messageClass, message, ctx);
      return next();
    }
    if (!chatId) {
      globalLog.error('createSaveOutMiddleware FIX: this !chatId', messageClass, message, ctx);
      return next();
    }
    if (!messageId) {
      globalLog.error('createSaveOutMiddleware FIX: this !messageId 22', messageClass, message, ctx);
      return next();
    }
    const $set = {
      botId,
      chatId,
      messageId,
      ...message,
    };
    await Promise.all([
      service.upsertMessage({ botId, chatId, messageId }, omitTrash($set)),
      service.upsertChat(
        { botId, chatId },
        { lastMessage: omitTrash(message), updatedAt: new Date() },
      ),
      service.upsertDialog(
        { botId, chatId },
        { lastMessage: omitTrash(message), updatedAt: new Date() },
      ),
    ]);
    service.eventEmitter.emit('dialogUpdated', {
      botId,
      chatId,
      event: 'outcomeMessage',
      $set: omitTrash($set),
    });
    return next();
  };

export const saveOutMiddleware = createSaveOutMiddleware({ service: saveServiceMock });
