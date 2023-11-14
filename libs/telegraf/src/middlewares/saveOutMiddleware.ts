import { log as globalLog } from '@lskjs/log/log';
import { map } from 'fishbird';

import { saveServiceMock } from './utils/saveServiceMock';
import { SaveService } from './utils/types';

const mutedMethods = ['getMe', 'getUpdates', 'deleteWebhook'];

export const createSaveOutMiddleware = ({ service }: { service: SaveService }) =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function saveOutMiddleware(ctx, next) {
    if (mutedMethods.includes(ctx?.callApiOptions?.method)) return;
    if (!ctx.botInfo) {
      globalLog.warn('!!!ctx.botInfo', ctx.botInfo);
      globalLog.warn('!!!ctx?', ctx);
      return;
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
      await next();
      return;
    }
    const botId = ctx?.botInfo?.id;
    const chatId = message?.chat?.id;
    const messageId = message?.message_id;

    if (!botId) {
      globalLog.error('FIX: this !botId', message, ctx);
      return;
    }
    if (!chatId) {
      globalLog.error('FIX: this !chatId', message, ctx);
      return;
    }
    if (!messageId) {
      globalLog.error('FIX: this !messageId 22', message, ctx);
      return;
    }
    const $set = {
      botId,
      chatId,
      messageId,
      ...message,
    };
    await Promise.all([
      service.upsertMessage({ botId, chatId, messageId }, $set),
      service.upsertChat({ botId, chatId }, { lastMessage: message, updatedAt: new Date() }),
      service.upsertDialog({ botId, chatId }, { lastMessage: message, updatedAt: new Date() }),
    ]);
    service.eventEmitter.emit('dialogUpdated', { botId, chatId, event: 'outcomeMessage', $set });
    await next();
  };

export const saveOutMiddleware = createSaveOutMiddleware({ service: saveServiceMock });
