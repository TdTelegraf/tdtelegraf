// import { Context } from 'telegraf/lib/context';
// import { Logger } from '@lskjs/log';
import { mkdirSync } from 'node:fs';

import { omit } from '@lskjs/algos';
import { Logger } from '@lskjs/log';
import { Client, ClientOptions, createClient } from 'tdl';
import { Context, Telegraf } from 'telegraf';

import { callApi } from './callApi';
import { saveMock } from './debug';
import { convertBotInfo, convertToTelegrafMessage } from './utils';

const ignoredActions = [
  'init',
  'updateOption',
  'updateAuthorizationState',
  'updateDefaultReactionType',
  'updateAnimationSearchParameters',
  'updateAttachmentMenuBots',
  'updateSelectedBackground',
  'updateFileDownloads',
  'updateDiceEmojis',
  'updateActiveEmojiReactions',
  'updateChatThemes',
  'updateScopeNotificationSettings',
  'updateChatFolders',
  'updateUnreadChatCount',
  'updateStoryStealthMode',
  'updateHavePendingNotifications',
  'updateConnectionState',
  'updateUser',
  'updateNewChat',
  'updateChatReadInbox',
  'updateNewMessage',
  'updateChatLastMessage',
  'updateUserStatus',
  'updateMessageInteractionInfo',
  'updateChatAction',
  'updateSupergroup',
  'updateDeleteMessages',
  'updateChatReadOutbox',
  'updateMessageSendSucceeded',
  'updateChatNotificationSettings',
  'updateFile',
  'updateMessageContent',
  'updateFile',
  'updateUnconfirmedSession',
];

interface TdTelegrafOptions extends ClientOptions {
  databaseDirectory: string;
  filesDirectory: string;
  onLaunch?: () => void;
  onStop?: () => void;
}

export class TdTelegraf extends Telegraf {
  onListeners = new Set<any[]>();
  useListeners = new Set<any[]>();
  commandListeners = new Set<any[]>();
  convertToTelegrafMessage = convertToTelegrafMessage;

  tdlibProps: TdTelegrafOptions;
  tdlib: Client;
  log: Logger;

  // @ts-ignore
  botInfo: any;
  rawBotInfo: any;
  constructor(tdlibProps: TdTelegrafOptions) {
    super(null, {});
    this.tdlibProps = tdlibProps;
    // TODO: прокинуть явно, без всякой магии
    const accountId = tdlibProps.databaseDirectory.split('/').reverse()[1];
    this.convertToTelegrafMessage = convertToTelegrafMessage.bind(this);

    this.log = new Logger({ ns: 'tdl', name: accountId });
    this.tdlib = this.createClient(this.tdlibProps);
    // @ts-ignore
    this.telegram.callApi = callApi.bind(this);
  }
  createClient(tdlibProps: ClientOptions) {
    if (tdlibProps.databaseDirectory) {
      mkdirSync(tdlibProps.databaseDirectory, { recursive: true });
    }
    if (tdlibProps.filesDirectory) {
      mkdirSync(tdlibProps.filesDirectory, { recursive: true });
    }
    const tdlib = createClient(tdlibProps);
    // const accountId = tdlibProps.databaseDirectory.split('/').reverse()[1];
    this.log.debug('[init]');
    tdlib.on('update', this.onTdlUpdate.bind(this));
    tdlib.on('error', this.onTdlError.bind(this));

    return tdlib;
  }
  // @ts-ignore
  on(key, cb) {
    if (!['string', 'function'].includes(typeof key) || typeof cb !== 'function') return;
    this.onListeners.add([key, cb]);
  }
  // @ts-ignore
  use(cb) {
    this.useListeners.add([cb]);
  }
  // @ts-ignore
  command(command, cb) {
    this.commandListeners.add([command, cb]);
  }
  async onTdlError(err) {
    this.log.error('[err]', err);
  }
  async onTdlUpdate(msg) {
    const action = msg._;
    await saveMock(`${action}.tdlib.update.json`, msg);
    if (ignoredActions.includes(action)) {
      // TODO: trace
    } else {
      this.log.debug(`[${msg._}]`, omit(msg, ['_']));
    }

    // console.log(msg._ === 'updateNewMessage', msg._);
    if (msg._ === 'updateNewMessage' && !msg.message.is_outgoing) {
      // console.log(JSON.stringify(msg, 0, 2));
      const { message } = msg;
      const newMessage = await this.convertToTelegrafMessage(message);
      const update = {
        update_id: message.date,
        message: newMessage,
      };

      // const ContextType = this.options.contextType;
      // @ts-ignore
      const ctx = new Context(update, {}, {});
      // @ts-ignore
      ctx.botInfo = this.botInfo;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // @ts-ignore
      if (!ctx.tdl) ctx.tdl = {};
      // @ts-ignore
      ctx.tdl.getChat = (chatId) => {
        // const user = await this.tdlib.invoke({
        //   _: 'getUser',
        //   user_id: message.sender_id.user_id,
        // });
        // const res = await this.tdlib.invoke({
        //   _: 'getChat',
        //   chat_id: chatId,
        // });

        this.log.warn('[getChat] TODO: implement', chatId);
      };
      // @ts-ignore
      ctx.tdl.getUserProfilePhotos = (props) => {
        this.log.warn('[getUserProfilePhotos] TODO: implement', props);
      };
      // @ts-ignore
      ctx.tdl.getChatAdministrators = (props) => {
        this.log.warn('[getChatAdministrators] TODO: implement', props);
      };
      // @ts-ignore
      ctx.tdl.sendMessage = (props) => {
        this.log.warn('[sendMessage] TODO: implement', props);
      };
      // @ts-ignore
      ctx.tdl.sendDocument = (props) => {
        this.log.warn('[sendDocument] TODO: implement', props);
      };
      // @ts-ignore
      ctx.tdl.sendPhoto = (props) => {
        this.log.warn('[sendPhoto] TODO: implement', props);
      };
      // @ts-ignore
      ctx.tdl.sendMediaGroup = (props) => {
        this.log.warn('[sendMediaGroup] TODO: implement', props);
      };

      ctx.telegram.sendMessage = (chatId, text, extra) =>
        // @ts-ignore
        this.telegram.callApi('sendMessage', { chat_id: chatId, text, ...extra });

      // this.log.trace('[ctx]', ctx);
      // eslint-disable-next-line no-restricted-syntax
      for (const [cb] of this.useListeners) {
        // eslint-disable-next-line no-await-in-loop, no-async-promise-executor
        await new Promise(async (resolve, reject) => {
          try {
            await cb(ctx, resolve);
          } catch (err) {
            reject(err);
          }
        });
      }

      const command = newMessage.text?.[0] === '/' ? newMessage.text?.split(' ')[0] : null;

      // eslint-disable-next-line no-restricted-syntax
      for (const [key, cb] of this.commandListeners) {
        if (`/${key}` === command) {
          cb(ctx);
          return;
        }
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const [key, cb] of this.onListeners) {
        // console.log(key, cb);
        if (typeof key === 'string' && key in newMessage) {
          cb(ctx);
        }
        if (typeof key === 'function' && key(update)) {
          cb(ctx);
        }
      }
    }
  }
  async updateBotInfo() {
    // TODO: catch [f] { _: 'error', code: 401, message: 'Unauthorized' }
    await this.tdlib
      .invoke({
        _: 'getMe',
      })
      .then((rawBotInfo) => {
        // this._botInfo = convertBotInfo(raw);
        // @ts-ignore
        this.rawBotInfo = rawBotInfo;
        // @ts-ignore
        this.botInfo = convertBotInfo(rawBotInfo);
      })
      .catch((err) => {
        this.log.error('TODO: [updateBotInfo]', err);
      });
  }
  async launch() {
    const onLaunch = this.tdlibProps?.onLaunch || function () {};
    // eslint-disable-next-line no-return-await
    const res = await onLaunch.call(this);
    await this.updateBotInfo();
    return res;
  }
  async stop(signal?: string) {
    this.log.debug('[stop]', signal);
    this.tdlib.close(); // TODO: await?
    const onStop = this.tdlibProps?.onStop || function () {};
    // eslint-disable-next-line no-return-await
    return await onStop.call(this, signal);
  }
}

// TODO: сделать нормальный логин
// export type LoginUser = {
//   type: 'user',
//   /** Handler for `authorizationStateWaitPhoneNumber`, will be recalled on error. */
//   getPhoneNumber: (retry?: boolean) => Promise<string>,
//   /** Handler for `authorizationStateWaitEmailAddress`, TDLib v1.8.6+ only. */
//   getEmailAddress: () => Promise<string>,
//   /** Handler for `authorizationStateWaitEmailCode`, TDLib v1.8.6+ only. */
//   getEmailCode: () => Promise<string>,
//   /** Handler for `authorizationStateWaitOtherDeviceConfirmation`, sends nothing. */
//   confirmOnAnotherDevice: (link: string) => void,
//   /** Handler for `authorizationStateWaitCode`, will be recalled on error. */
//   getAuthCode: (retry?: boolean) => Promise<string>,
//   /** Handler for `authorizationStateWaitPassword`, will be recalled on error. */
//   getPassword: (passwordHint: string, retry?: boolean) => Promise<string>,
//   /** Handler for `authorizationStateWaitRegistration`. */
//   getName: () => Promise<{ firstName: string, lastName?: string }>
// }
