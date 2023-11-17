/* eslint-disable camelcase */

import { getMessageText } from '../../utils/getMessageText';
import { getMessageType } from '../../utils/getMessageType';

export const getTitle = (info) => {
  if (!info) return null;
  if (info.title) return info.title;
  if (info.first_name || info.last_name) {
    return [info.first_name, info.last_name].filter(Boolean).join(' ');
  }
  return null;
};

const getPrimaryKey = (ctx) => {
  const ignoredCtxKeys = ['telegram', 'botInfo', 'state'];
  const ignoredUpdateKeys = ['update_id', 'botInfo', 'state'];
  const keys = Object.keys(ctx).filter(
    (key) => !ignoredCtxKeys.includes(key) && !ignoredUpdateKeys.includes(key),
  );
  return keys[0];
};

export const getCtxInfo = (ctx) => {
  const { botInfo } = ctx;
  const callApiOptions = ctx?.callApiOptions;

  const botType = botInfo?.is_tdl ? 'tdl' : 'tg';
  const botId = botInfo?.id;
  const botUsername = botInfo?.username;
  const botTitle = getTitle(botInfo);

  let direction: any;

  let fromId: any;
  let fromUsername: any;
  let fromTitle: any;

  let chatType: any;
  let chatId: any;
  let chatUsername: any;
  let chatTitle: any;

  let method: any;
  let action: any;

  let messageClass: any;
  let messageType: any;
  let messageText: any;

  if (callApiOptions) {
    direction = 'out';
    console.log('[callApiOptions]', callApiOptions);

    const isResArray = Array.isArray(callApiOptions?.res);
    const res = isResArray ? callApiOptions?.res[0] : callApiOptions?.subRes || callApiOptions?.res;

    if (res) {
      fromId = res?.from?.id;
      fromUsername = res?.from?.username;
      fromTitle = getTitle(res?.from);
    } else {
      fromId = botInfo?.id;
      fromUsername = botInfo?.username;
      fromTitle = getTitle(botInfo);
    }

    if (res?.chat) {
      chatType = res?.chat?.type;
      chatId = res?.chat?.id;
      chatUsername = res?.chat?.username;
      chatTitle = getTitle(res?.chat);
    } else {
      chatType = null;
      chatId = callApiOptions?.payload?.chat_id || callApiOptions?.payload?.user_id; // NOTE: подумать а правильно ли user_id
      chatUsername = null;
      chatTitle = null;
    }

    method = callApiOptions?.method;
    action = callApiOptions?.payload?.action;

    if (action) {
      messageClass = 'action';
      messageType = action;
    } else if (
      method?.startsWith('send') ||
      method === 'onUpdate' ||
      method === 'updateNewMessage'
    ) {
      messageClass = 'message';
    }
    if (messageClass === 'message') {
      // TODO: check media
      messageType = res ? getMessageType(res) : getMessageType(callApiOptions?.payload);
      if (isResArray) {
        const types = callApiOptions?.res.map((item) => getMessageType(item));
        messageType = `media ${types.join(',')}`;
        const texts = callApiOptions?.res.map((item) => getMessageText(item));
        messageText = texts.filter(Boolean).join(' ');
      } else {
        messageType = res ? getMessageType(res) : getMessageType(callApiOptions?.payload);
        messageText = res ? getMessageText(res) : getMessageText(callApiOptions?.payload);
      }
    }
    if (!messageClass) {
      messageClass = 'callApi';
      messageType = method;
    }
  } else {
    direction = 'in';

    let primaryKey: any;
    let res: any;
    // /Users/isuvorov/projects/telegraf/src/context.ts
    if (ctx.update) {
      primaryKey = getPrimaryKey(ctx.update);
      res = ctx.update[primaryKey];
    } else {
      primaryKey = getPrimaryKey(ctx);
      res = ctx[primaryKey];
    }

    // console.log('[ctx]', ctx);
    // console.log('[primaryKey]', { primaryKey });
    // console.log('[res]', { res });

    fromId = res?.from?.id;
    fromUsername = res?.from?.username;
    fromTitle = getTitle(res?.from);

    chatType = res?.chat?.type;
    chatId = res?.chat?.id;
    chatUsername = res?.chat?.username;
    chatTitle = getTitle(res?.chat);

    messageType = getMessageType(res);
    messageText = getMessageText(res); // todo: callback data

    messageClass = primaryKey;
    if (primaryKey === 'my_chat_member') {
      messageType = ctx?.my_chat_member?.new_chat_member?.status;
    }
    if (messageType === 'new_chat_title') {
      messageText = res?.new_chat_title;
    }
    method = 'onUpdate';
  }

  // let messageClass;
  // if (primaryKey) {
  //   messageClass = primaryKey
  //   // messageType = action;
  // } else if (method?.startsWith('send') || method === 'onUpdate' || method === 'updateNewMessage') {
  //   messageClass = 'message';
  // } else {
  //   console.log('??? [ctx]', ctx, { method, action });
  // }
  if (!messageClass) messageClass = method;
  if (!messageClass) messageClass = '??';

  return {
    direction,
    botType,
    botId,
    botUsername,
    botTitle,

    fromId,
    fromUsername,
    fromTitle,

    chatType,
    chatId,
    chatUsername,
    chatTitle,

    method,
    action,

    messageClass,
    messageType,
    messageText,
  };
};
