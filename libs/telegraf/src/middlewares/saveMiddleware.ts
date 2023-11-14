import { getBotLogger } from './utils/getBotLogger';
import { saveServiceMock } from './utils/saveServiceMock';
import { SaveService } from './utils/types';

export const createSaveMiddleware = ({ service }: { service: SaveService }) =>
  async function saveMiddleware(ctx) {
    const promises = [];
    const { message } = ctx;
    const botId = ctx.botInfo.id;
    const user = message?.from;
    const userId = user?.id;
    if (userId && !service.hasUser({ botId, userId })) {
      // TODO: cache
      // && !(await TelegramUserModel.findOne({ botId, userId }))) {
      const info = await ctx.tdl.getChat(userId);
      const photos = await ctx.tdl.getUserProfilePhotos(userId);
      const $set = { ...user, info, photos };
      // console.log('[user]', $set);
      promises.push(service.upsertUser({ botId, userId }, $set));
    }
    const chat = message?.chat;
    const chatId = chat?.id;
    if (chatId && !service.hasChat({ botId, chatId })) {
      // && !(await TelegramChatModel.findOne({ botId, chatId }))) {
      const info = await ctx.tdl.getChat(chatId);
      let administrators;
      let memberCount;
      if (chat.type !== 'private') {
        administrators = await ctx.tdl.getChatAdministrators(chatId);
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
          lastMessage: message,
          updatedAt: new Date(),
        };
      }
      promises.push(service.upsertChat({ botId, chatId }, $set));
    }
    const messageId = message?.message_id;
    let $set;
    if (messageId) {
      $set = {
        botId,
        chatId,
        messageId,
        ...message,
      };
      promises.push(service.upsertMessage({ botId, chatId, messageId }, $set));
      promises.push(
        service.upsertDialog({ botId, chatId }, { lastMessage: message, updatedAt: new Date() }),
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
    service.eventEmitter.emit('dialogUpdated', { botId, chatId, event: 'incomeMessage', $set });
  };

export const saveMiddleware = createSaveMiddleware({ service: saveServiceMock });
