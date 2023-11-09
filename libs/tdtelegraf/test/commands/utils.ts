/* eslint-disable camelcase */

// import { getMessageType } from '@chatterfy/core/utils/telegramHelpers';
import { omitNull } from '@lskjs/algos';
import { createLogger } from '@lskjs/log';

import { getMessageType } from './onChatIdCommand';

const botClientLoggers = {};
export const getBotClientLogger = (botInfo) => {
  const botUsername = botInfo?.username || botInfo?.id;
  if (!botClientLoggers[botUsername]) {
    botClientLoggers[botUsername] = createLogger(`bot:${botUsername}`);
  }
  return botClientLoggers[botUsername];
};

export const getInfoFromCtx = (ctx) => {
  const { botInfo } = ctx;

  const message = ctx?.update?.message;
  const callback_query = ctx?.update?.callback_query;
  const my_chat_member = ctx?.my_chat_member;

  const from = message?.from || callback_query?.from || my_chat_member?.from;
  const chat = message?.chat || callback_query?.chat || my_chat_member?.chat;

  const log = getBotClientLogger(botInfo);

  const chatType = chat?.type || chat?.message?.type;

  let action = null;
  if (my_chat_member) {
    action = my_chat_member?.new_chat_member?.status;
  } else if (callback_query) {
    action = 'callback';
  } else {
    action = 'message';
  }
  const text = message?.text || callback_query?.data || '';
  const messageType = getMessageType(message || {});
  return {
    log,
    user: from?.username || from?.id,
    chatType,
    chat: chat?.username || chat?.title || chat?.id,
    botInfo,
    botId: botInfo?.id,
    action,
    messageType,
    message,
    text,
  };
};

export const botClientLoggerMiddleware = (ctx, next) => {
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
  // console.log(
  //   'botClientLoggerMiddleware',
  //   log,
  //   user,
  //   chat,
  //   chatType,
  //   action,
  //   text,
  //   messageType,
  //   next,
  // );
  return next();
};

export async function logOutcomingMessage(method, ctx, args, message) {
  if (Array.isArray(message)) {
    // TODO: подумать??/
    await Promise.all(message.map((msg) => logOutcomingMessage(method, ctx, args, msg)));
    return;
  }
  const { log, action, user, chat, chatType } = getInfoFromCtx(ctx);
  const { text } = message;
  const userOrUserId = user || args[0];
  // if (!user) console.log('ctx', ctx, args[0]);
  // eslint-disable-next-line no-nested-ternary
  const messageType = getMessageType(message || {});
  log.trace(
    [
      method !== 'sendMessage' ? method : '',
      '=>',
      action !== 'message' ? `${action} ` : '',
      `[${userOrUserId}]`,
      chat && chatType !== 'private' ? `(${chat})` : '',
      messageType,
      text,
    ]
      .filter(Boolean)
      .join(' '),
  );
}

export async function saveIncomingMessage(service: any, ctx) {
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
    const log = getBotClientLogger(ctx.botInfo);
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
}

export async function saveOutcomingMessage(service: any, method, ctx, args, res) {
  // service.eventEmitter;
  //
  if (Array.isArray(res)) {
    await Promise.all(res.map((msg) => saveOutcomingMessage(service, method, ctx, args, msg)));
    return;
  }
  const { id: botId } = ctx.botInfo;
  const message = res;

  const chatId = message?.chat?.id;
  const messageId = message?.message_id;
  if (!messageId) {
    service.log.error('!messageId 22', message, ctx);
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
}

export const patchBotClient = (bot, callback) => {
  ['sendMessage', 'sendDocument', 'sendPhoto', 'sendMediaGroup'].forEach((method) => {
    const fn = bot.telegram[method];
    // eslint-disable-next-line no-param-reassign
    bot.telegram[method] = async function (...args) {
      const res = await fn.apply(bot.telegram, args);
      const ctx = { botInfo: bot.botInfo };
      if (callback) await callback(method, ctx, args, res);
      return res;
    };
  });
};

export function getTypingDelay(text: string, charsPerMinute = 200) {
  const ms = (text.length / charsPerMinute) * 60 * 1000;
  if (ms > 5000) return 5000;
  if (ms < 1000) return 1000;
  return ms;
}

// export const getTypeBySrc = (src, rawType) =>
//   // eslint-disable-next-line no-nested-ternary
//   (rawType === 'media'
//     ? (src?.url || '').includes('mp4')
//       ? 'video'
//       : 'photo'
//     : 'document') as 'photo';

// eslint-disable-next-line no-shadow
export const isNeedCaption = (text, rawType, j, last) =>
  text && ((rawType !== 'document' && j === 0) || (rawType === 'document' && j === last));

export function getMessages({
  medias: rawRawMedias = [],
  messagesDelemiter: initMessageDelemiter,
  type: initType,
  ...props
}) {
  const defaultType = !['audio', 'document', 'video', 'photo', 'video_note'].includes(initType)
    ? 'document'
    : initType;

  const rawMedias = rawRawMedias
    .map((src) => ({
      type: src.type || defaultType,
      filename: src.name,
      ...src,
    }))
    .filter((a) => a.url);

  const rawText = props.message || props.text || props.caption || '';
  const trimmedText = rawText.trim().replaceAll(/\\n/gi, '\n');
  const md = initMessageDelemiter || '\n\n';
  let texts = trimmedText
    .split(md)
    .map((a) => a.trim())
    .filter(Boolean);
  if (texts.length === 0 && rawMedias.length) texts = [''];
  if (['document', 'video', 'photo'].includes(defaultType)) {
    return texts.map((text, i) => {
      if (i === 0) {
        const medias = rawMedias.map((media, j) =>
          omitNull({
            type: media.type,
            media,
            caption: isNeedCaption(text, media.type, j, rawMedias.length - 1) ? text : null,
          }),
        );
        // console.log({ i, rawType, medias, text });
        if (medias.length) {
          return { type: defaultType === 'document' ? 'document' : defaultType, medias };
        }
        return { type: 'text', text };
      }
      const ms = getTypingDelay(text); // , typingSpeed);
      return { type: 'text', text, delay: ms };
    });
  }

  return [
    ...rawMedias.map((media) => ({
      type: media?.type || defaultType,
      media,
    })),
    ...texts.map((text, i) => ({
      type: 'text',
      text,
      delay: i === 0 ? 0 : getTypingDelay(text),
    })),
  ];

  // console.log({ texts, rawMedias });
}

// export async function splitTextAndReply(ctx: Context, raw: MessageInfo | MessageText) {
//   const botId = ctx?.botInfo?.id;
//   const botConfig = await findBotConfig({ botId });
//   const messagesDelemiterRaw = botConfig.getConfig('common.messagesDelemiter') || '\n\n';
//   const messagesDelemiter = messagesDelemiterRaw.replace(/\\n/gi, '\n');

//   const typingSpeed = botConfig.getConfig('common.typingSpeed');

//   const rawText = typeof raw === 'string' ? raw : raw?.text || '';
//   const rawMedias = typeof raw === 'string' ? [] : raw?.medias || [];
//   // @ts-ignore
//   const rawType = rawMedias?.length ? raw.type : 'text';

//   const text = rawText.trim().replaceAll(/\\n/gi, '\n');
//   const messages = text
//     .split(messagesDelemiter)
//     .map((a) => a.trim())
//     .filter(Boolean);
//   let messageId = ctx?.message?.message_id;
//   // if (!messageId) {
//   //   console.log('!messageId', ctx.message);
//   // }
//   if (rawMedias.length && !messages.length) {
//     messages.push('');
//   }
//   const ress = await mapSeries(messages, async (message, i) => {
//     ctx.sendChatAction('typing');
//     if (i) await delay(getTypingDelay(message, typingSpeed));
//     // logOutcomingMessage(ctx, message);
//     let props = {};
//     if (isDev) {
//       props = {
//         reply_to_message_id: messageId,
//       };
//     }
//     // eslint-disable-next-line no-useless-catch
//     try {
//       let res;
//       if (!i && (rawType === 'media' || rawType === 'document')) {
//         res = await ctx.replyWithMediaGroup(
//           rawMedias.map((src, j) => {
//             // console.log('src', src);
//             const type = (
//               rawType === 'media'
//                 ? (src?.url || '').includes('mp4')
//                   ? 'video'
//                   : 'photo'
//                 : 'document'
//             ) as 'photo';
//             const isNeedCaption =
//               message &&
//               ((rawType === 'media' && j === 0) ||
//                 (rawType === 'document' && j === rawMedias.length - 1));
//             // @ts-ignore
//             const media = { url: src.url, filename: src.name };
//             if (isNeedCaption) {
//               return { type, media, caption: message };
//             }
//             return { type, media };
//           }),
//           props,
//         );
//       } else {
//         res = await ctx.reply(message, props);
//       }

//       messageId = res?.message_id;
//       if (!res?.message_id && !res?.[0]?.message_id) {
//         log.error('!messageId', res, { message, props });
//       }
//       return res;
//     } catch (err) {
//       // TODO: catch
//       throw err;
//     }
//   });
//   const resss = ress.flat();
//   resss.forEach((res) => {
//     messageId = res?.message_id;
//     if (!messageId) {
//       log.error('!messageId 33', res);
//     }
//   });
//   // console.log('resss', resss);
//   return ress.flat();
// }
