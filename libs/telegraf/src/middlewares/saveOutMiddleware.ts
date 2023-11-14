import { log } from '@lskjs/log/log';
import { map } from 'fishbird';

import { saveServiceMock } from './utils/saveServiceMock';
import { SaveService } from './utils/types';

export const createSaveOutMiddleware = ({ service }: { service: SaveService }) =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function saveOutMiddleware(ctx, next) {
    const { method, payload, res, subRes } = ctx?.callApiOptions || {};
    if (Array.isArray(res)) {
      await map(
        res,
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
    const message = subRes || res;
    const { id: botId } = ctx.botInfo;

    const chatId = message?.chat?.id;
    const messageId = message?.message_id;
    if (!messageId) {
      log.error('TODO: fix this !messageId 22', message, ctx);
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
