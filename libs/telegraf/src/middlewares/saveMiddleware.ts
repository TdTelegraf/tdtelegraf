import { omit } from '@lskjs/algos';
import { isDev } from '@lskjs/env';
import { log as globalLog } from '@lskjs/log/log';

import { getBotLogger } from './utils/getBotLogger';
import { getCtxInfo } from './utils/getCtxInfo';
import { saveServiceMock } from './utils/saveServiceMock';
import { SaveService } from './utils/types';

export const omitTrash = isDev ? (value) => omit(value, ['_raw', '_content']) : (a) => a;

export const createSaveMiddleware = ({ service }: { service: SaveService }) =>
  async function saveMiddleware(ctx, next) {
    const { messageClass } = getCtxInfo(ctx);
    if (messageClass !== 'message') return next();

    const promises = [];

    const { message } = ctx;

    const botId = ctx.botInfo?.id;
    const user = message?.from;
    const userId = user?.id;
    const chat = message?.chat;
    const chatId = chat?.id;
    const messageId = message?.message_id;
    if (!botId) {
      globalLog.error('saveMiddleware FIX: this !botId', messageClass, message, ctx);
      return next();
    }
    if (!chatId) {
      globalLog.error('saveMiddleware FIX: this !chatId', messageClass, message, ctx);
      return next();
    }
    if (!messageId) {
      globalLog.error('saveMiddleware FIX: this !messageId 22', messageClass, message, ctx);
      return next();
    }
    if (userId && !service.hasUser({ botId, userId })) {
      // TODO: cache
      // && !(await TelegramUserModel.findOne({ botId, userId }))) {
      const info = await ctx.telegram.getChat(userId);
      const photos = await ctx.telegram.getUserProfilePhotos(userId);
      const $set = { ...user, info, photos };
      // console.log('[user]', $set);
      promises.push(service.upsertUser({ botId, userId }, omitTrash($set)));
    }
    if (chatId && !service.hasChat({ botId, chatId })) {
      // && !(await TelegramChatModel.findOne({ botId, chatId }))) {
      const info = await ctx.telegram.getChat(chatId);
      let administrators;
      let memberCount;
      if (chat.type !== 'private') {
        administrators = await ctx.telegram.getChatAdministrators(chatId);
        // console.log('ctx.tdl, ', ctx.tdl);
        // memberCount = await ctx.tdl.getChatMemberCount(chatId);
      }
      let $set = {
        ...chat,
        info,
        administrators,
        memberCount,
      };
      if (message?.message_id) {
        $set = {
          ...$set,
          lastMessage: omitTrash(message),
          updatedAt: new Date(),
        };
      }
      promises.push(service.upsertChat({ botId, chatId }, omitTrash($set)));
    }
    let $set;
    if (messageId) {
      $set = {
        botId,
        chatId,
        messageId,
        ...message,
      };
      promises.push(service.upsertMessage({ botId, chatId, messageId }, omitTrash($set)));
      promises.push(
        service.upsertDialog(
          { botId, chatId },
          { lastMessage: omitTrash(message), updatedAt: new Date() },
        ),
      );

      // await DialogModel.updateOne(
      //   {
      //     botId,
      //     chatId,
      //   },
      //   {
      //     $set: {
      //       nextCronAt: new Date(),
      //     },
      //   },
      // );
    } else {
      const log = getBotLogger(ctx.botInfo);
      if (
        ctx.update?.my_chat_member?.new_chat_member?.user?.is_bot &&
        (ctx.update?.my_chat_member?.new_chat_member?.status === 'kicked' ||
          ctx.update?.my_chat_member?.new_chat_member?.status === 'member')
      ) {
        // eslint-disable-next-line no-shadow
        const chatId = ctx.update?.my_chat_member?.chat?.id;
        log.warn('Action', { chatId }, ctx.update?.my_chat_member?.new_chat_member?.status);
      } else if (ctx?.update?.edited_message) {
        log.warn('Action', { chatId }, 'edited_message', ctx?.update?.edited_message?.message_id);
      } else {
        log.error(
          '!messageId 11',
          ctx.update?.my_chat_member ? ctx.update?.my_chat_member : ctx.update,
        );
      }
      // service.upsertDialog({ botId, chatId }, { status: 'ban', updatedAt: new Date() }),
    }
    await Promise.all(promises);
    service.eventEmitter.emit('dialogUpdated', {
      botId,
      chatId,
      event: 'incomeMessage',
      $set: omitTrash($set),
    });
    return next();
  };

export const saveMiddleware = createSaveMiddleware({ service: saveServiceMock });
