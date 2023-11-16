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

  let messageType: any;
  let messageText: any;

  if (callApiOptions) {
    direction = 'out';

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
      chatId = callApiOptions?.payload?.chat_id;
      chatUsername = null;
      chatTitle = null;
    }

    method = callApiOptions?.method;
    action = callApiOptions?.payload?.action;

    // if (!chatTitle) {
    //   console.log('[res]', res, { chatId });
    // }
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
  } else {
    direction = 'in';

    const message = ctx?.update?.message;
    const callback_query = ctx?.update?.callback_query;
    const my_chat_member = ctx?.my_chat_member;

    const from = message?.from || callback_query?.from || my_chat_member?.from;
    const chat = message?.chat || callback_query?.chat || my_chat_member?.chat;

    fromId = from?.id;
    fromUsername = from?.username;
    fromTitle = getTitle(from);

    chatType = chat?.type || chat?.message?.type;
    chatId = chat?.id;
    chatUsername = chat?.username;
    chatTitle = getTitle(chat);

    method = 'onUpdate';

    if (my_chat_member) {
      action = my_chat_member?.new_chat_member?.status;
    } else if (callback_query) {
      action = 'callback';
    }
    messageType = getMessageType(message || {});
    messageText = message?.text || callback_query?.data || '';
  }

  let messageClass;
  if (action) {
    messageClass = 'action';
    messageType = action;
  } else if (method?.startsWith('send') || method === 'onUpdate' || method === 'updateNewMessage') {
    messageClass = 'message';
  } else {
    console.log('??? [ctx]', ctx, { method, action });
    messageClass = '??';
  }

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
