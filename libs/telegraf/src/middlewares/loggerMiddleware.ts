/* eslint-disable no-nested-ternary */
import { omitNull } from '@lskjs/algos';

import { getBotLogger } from './utils/getBotLogger';
import { getCtxInfo } from './utils/getCtxInfo';

// const isDebug = isDev;
const isDebug = false;

const username = (str) => (str ? `@${str}` : null);
const fixWidth = (rawStr, maxLength = 30, dots = '..') => {
  const str = rawStr.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  const maxStrLength = maxLength - dots.length;
  if (str.length > maxStrLength) {
    return str.slice(0, maxStrLength) + dots;
  }
  return str + ' '.repeat(maxLength - str.length);
};

const isTrim = true;

export const loggerMiddleware = (ctx, next) => {
  const log = getBotLogger(ctx.botInfo);
  const info = getCtxInfo(ctx);
  const {
    direction,
    method,

    fromId,
    fromUsername,
    fromTitle,

    chatType,
    chatId,
    chatUsername,
    chatTitle,

    action,
    messageClass,
    messageType,
    messageText,
  } = info;

  let str = '';
  if (direction === 'in') {
    str = '<=';
  } else {
    str = '=>';
  }

  const opponent = [];
  if (direction === 'in') {
    opponent.push(`${username(fromUsername) || fromTitle || fromId}`);
  }
  const chatName = `${chatTitle || username(chatUsername) || chatId}`;
  const chatType2 =
    chatType === 'private'
      ? null
      : chatType === 'group'
      ? null
      : chatType === 'supergroup'
      ? null
      : chatType === 'channel'
      ? 'ch'
      : chatType;

  if (chatType !== 'private') {
    if (chatType2) {
      opponent.push(`(${chatType2} ${chatName})`);
    } else {
      opponent.push(`(${chatName})`);
    }
  } else if (direction === 'out') {
    opponent.push(`${username(chatUsername) || chatTitle || chatId}`);
  }

  if (isTrim) {
    str += ` ${fixWidth(opponent.filter(Boolean).join(' '), 24, '')}`;
  } else {
    str += ` ${opponent.filter(Boolean).join(' ')}`;
  }
  // }
  if (messageClass) {
    // if (messageClass === 'message') {
    //   str += ` [msg]`;
    // } else {
    //   str += ` [${messageClass}]`;
    // }
    str += ` [${messageClass}]`;
  }
  if (messageType) {
    str += ` [${messageType}]`;
  }
  if (messageText) {
    if (isTrim) {
      str += ` ${fixWidth(messageText, 30)}`;
    } else {
      str += ` ${messageText}`;
    }
  }

  const showDebug = messageClass === '??' || Boolean(isDebug && (action || method));
  if (showDebug) {
    str += ` ${JSON.stringify(omitNull({ action, method }))}}`;
  }

  // console.log(info);
  log.debug(str);

  // const { action, user, chat, chatType } = getInfoFromCtx(ctx);
  // const { text } = message;
  // const userOrUserId = user; // || args[0];
  // const messageType = getMessageType(message || {});
  // const str = [
  //   method !== 'sendMessage' ? method : '',
  //   '=>',
  //   action !== 'message' ? `${action} ` : '',
  //   `[${userOrUserId}]`,
  //   chat && chatType !== 'private' ? `(${chat})` : '',
  //   messageType,
  //   text,
  // ]
  //   .filter(Boolean)
  //   .join(' ');
  // // console.log('messageType', messageType, str);
  // log.debug(str);

  // log.debug(
  //   [
  //     '=>',
  //     action !== 'message' ? `${action} ` : '',
  //     `[${user}]`,
  //     chat && chatType !== 'private' ? `(${chat})` : '',
  //     messageType,
  //     text,
  //   ]
  //     .filter(Boolean)
  //     .join(' '),
  // );
  return next();
};
