/* eslint-disable no-param-reassign */
/* eslint-disable no-async-promise-executor */
import './dotenv';

/* eslint-disable no-await-in-loop */
import { EventEmitter } from 'node:events';
import Readline from 'node:readline/promises';

import { Err } from '@lsk4/err';
import { createLogger } from '@lsk4/log';
import { onChatIdCommand, onPingCommand } from '@lskjs/telegraf/commands';
import {
  ignoreMiddleware,
  loggerMiddleware,
  loggerOutMiddleware,
} from '@lskjs/telegraf/middlewares';
import { delay, map } from 'fishbird';
import { message } from 'telegraf/filters';

import { TdTelegraf } from '../src/TdTelegraf';
import { waitFn } from '../src/utils/waitFn';
// import { botClientLoggerMiddleware, logOutcomingMessage, patchBotClient } from './commands/utils';
import { accountPhone, databaseDirectory, filesDirectory, tdlOptions } from './config';
import {
  pingAlertChats,
  pingAlertMessage,
  pingBots as rawPingBots,
  pingMessage,
  pingTimeout,
} from './pingConfig';

const pingBots = rawPingBots
  .map((b) => ({
    _id: b?._id?.$oid,
    username: b?.botInfo?.username,
    botId: typeof b?.botId === 'number' ? b?.botId : b?.botId?.$numberLong,
    // stage: b.stage,
    server: b.server,
    status: b.status,
    errs: [],
    timeout: null,
  }))
  .filter((b) => b.username && b.status === 'active')
  .filter((b) => b.server === 'dev')
  .reverse();
// .slice(0, 1);

console.table(pingBots);
setInterval(() => {
  console.table(pingBots);
}, 30000);

// console.log('pingBots', pingBots.map((b) => `@${b.username}`).join('\n'));

const log = createLogger('ping');

async function main() {
  const rl = Readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const bot: any = new TdTelegraf({
    ...tdlOptions,
    databaseDirectory,
    filesDirectory,
    async onStop() {
      log.warn('client.stop');
    },
    async onLaunch(this: any) {
      await this.tdlib.login(() => ({
        async getPhoneNumber() {
          log.warn('getPhoneNumber', accountPhone);
          return accountPhone;
        },
        async getAuthCode() {
          log.warn('Enter getAuthCode');
          return rl.question('Auth code: ');
        },
        async getPassword() {
          log.warn('Enter getAuthCode');
          return rl.question('Password code: ');
        },
      }));
    },
  });

  // NOTE: Default example from Telegraf tutorial: https://telegraf.js.org/
  bot.start((ctx: any) => ctx.reply('Welcome'));
  bot.help((ctx: any) => ctx.reply('Send me a sticker'));
  bot.on(message('sticker'), (ctx: any) => ctx.reply('👍'));
  bot.hears('hi', (ctx: any) => ctx.reply('Hey there'));
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  // // NOTE: Default rxample from @lskjs/telegraf tutorial
  bot.useOut(loggerOutMiddleware);

  const eventEmitter = new EventEmitter();
  const lastMessages = new Map();
  bot.use((ctx: any, next: any) => {
    if (ctx.update) eventEmitter.emit('update', ctx.update);
    // console.log('ctx.update', ctx.update);
    if (ctx.update?.message) {
      const chatId = String(ctx.chat.id);
      lastMessages.set(String(chatId), ctx.update.message);
    }
    return next();
  });
  bot.use(loggerMiddleware);

  bot.use(ignoreMiddleware);
  bot.command('ping', onPingCommand);
  bot.command('chatid', onChatIdCommand);

  //
  bot.catch((err: any) => {
    log.error('bot.catch', err);
  });
  await bot.launch();
  log.info('Bot started', bot.botInfo?.id, bot.botInfo?.username);

  const tryPing = async ({ chatId, botId, _id, username }: any) =>
    new Promise(async (resolve, reject) => {
      const timeout = setTimeout(async () => {
        reject(new Err('timeout', { chatId, botId, _id, username, pingTimeout }));
      }, pingTimeout);
      const msg = typeof pingMessage === 'function' ? pingMessage() : pingMessage;
      let res: any;
      try {
        res = await bot.telegram.sendMessage(chatId, msg);
        await waitFn(
          async () => {
            const lastMessage = lastMessages.get(chatId);
            if (!lastMessage) return false;
            // console.log('lastMessage?.message_id', lastMessage?.message_id);
            // console.log('res?.message_id', res?.message_id);
            // console.log('TRUE', lastMessage?.message_id > res?.message_id);
            if (!lastMessage?.message_id) return false;
            return lastMessage?.message_id > res?.message_id;
          },
          10,
          pingTimeout,
        );
        // console.log('OK!!!!!');
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
        return;
      }
      clearTimeout(timeout);
      resolve(true);
    });
  const tryPingAndNotify = async (pingBot: any) => {
    const { botId: chatId } = pingBot;
    const startedAt = Date.now();
    try {
      pingBot.status = 'pending';
      await tryPing({ chatId, ...pingBot });
      const finishedAt = Date.now();
      pingBot.status = 'ok';
      pingBot.errs = [];
      pingBot.timeout = finishedAt - startedAt;
    } catch (err: any) {
      log.error({ chatId }, err);
      const finishedAt = Date.now();
      pingBot.status = 'err';
      if (!pingBot.errs) pingBot.errs = [];
      pingBot.errs.push(Err.getCode(err));
      pingBot.timeout = finishedAt - startedAt;

      if (err.code === 400) return;
      log.error('timeout', chatId);

      // console.log(msg);
      if (pingBot.errs.length >= 3) {
        await map(pingAlertChats, async (pingAlertChatId) => {
          await bot.telegram.sendMessage(pingAlertChatId, pingAlertMessage({ err, pingBot }));
        });
      }
    }
  };

  // const promises = pingBots.map(async (pingBot: any) => {
  //   await delay(Math.floor(Math.random() * pingEvery));
  //   while (true) {
  //     await tryPingAndNotify(pingBot);
  //     await delay(pingEvery);
  //   }
  // });
  // await Promise.all(promises);

  while (true) {
    await map(
      pingBots,
      async (pingBot: any) => {
        if (pingBot.err === 400) return;
        await tryPingAndNotify(pingBot);
        await delay(5000);
      },
      { concurrency: 1 },
    );
  }
}

main().catch(log.fatal.bind(log));
