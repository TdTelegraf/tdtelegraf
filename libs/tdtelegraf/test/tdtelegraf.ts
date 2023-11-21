import Readline from 'node:readline/promises';

import { stage } from '@lskjs/env';
import { log } from '@lskjs/log/log';
import { onChatIdCommand, onPingCommand, onTestCommand } from '@lskjs/telegraf/commands';
import {
  ignoreMiddleware,
  loggerMiddleware,
  loggerOutMiddleware,
  saveMiddleware,
  saveOutMiddleware,
} from '@lskjs/telegraf/middlewares';
import { message } from 'telegraf/filters';

import { TdTelegraf } from '../src/TdTelegraf';
// import { botClientLoggerMiddleware, logOutcomingMessage, patchBotClient } from './commands/utils';
import {
  accountPhone,
  databaseDirectory,
  debugChatId,
  debugUserId,
  filesDirectory,
  tdlOptions,
} from './config';

async function main() {
  const rl = Readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const bot = new TdTelegraf({
    ...tdlOptions,
    databaseDirectory,
    filesDirectory,
    async onStop() {
      log.warn('client.stop');
    },
    async onLaunch() {
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
  bot.start((ctx) => ctx.reply('Welcome'));
  bot.help((ctx) => ctx.reply('Send me a sticker'));
  bot.on(message('sticker'), (ctx) => ctx.reply('👍'));
  bot.hears('hi', (ctx) => ctx.reply('Hey there'));
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  // // NOTE: Default rxample from @lskjs/telegraf tutorial
  bot.useOut(loggerOutMiddleware);
  bot.useOut(saveOutMiddleware);

  bot.use(loggerMiddleware);
  bot.use(saveMiddleware);
  bot.use(ignoreMiddleware);
  bot.command('ping', onPingCommand);
  bot.command('chatid', onChatIdCommand);

  // NOTE: custom example for debug TdTelegraf
  bot.command('test', onTestCommand);

  //
  bot.catch((err) => {
    log.error('bot.catch', err);
  });
  await bot.launch();
  log.info('Bot started', bot.botInfo?.id, bot.botInfo?.username);

  const userInfo = await bot.telegram.getChat(debugUserId);
  log.debug('[userInfo]', userInfo);
  const photos = await bot.telegram.getUserProfilePhotos(debugUserId);
  log.debug('[photos]', photos);
  const chatInfo = await bot.telegram.getChat(debugChatId);
  log.debug('[chatInfo]', chatInfo);
  const administrators = await bot.telegram.getChatAdministrators(debugChatId);
  log.debug('[administrators]', administrators);

  const res = await bot.telegram.sendMessage(
    debugChatId,
    `I'm started on ${stage} in debug mode 🙈\n\n/ping\n/chatid\n/test`,
  );
  // log.debug('sendMessage', res);
}

main().catch(log.fatal.bind(log));
