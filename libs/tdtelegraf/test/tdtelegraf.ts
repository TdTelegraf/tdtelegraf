import Readline from 'node:readline/promises';

import { stage } from '@lsk4/env';
import { log } from '@lsk4/log/log';
import { onChatIdCommand, onPingCommand, onTestCommand } from '@lskjs/telegraf/commands';
import {
  ignoreMiddleware,
  loggerMiddleware,
  loggerOutMiddleware,
  saveMiddleware,
  saveOutMiddleware,
} from '@lskjs/telegraf/middlewares';
import { delay } from 'fishbird';
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

  const bot: any = new TdTelegraf({
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
  // download file test
  const remoteFile = await bot.tdlib.invoke({
    _: 'getRemoteFile',
    remote_file_id: photos.photos[0][0].file_id,
  });
  await bot.tdlib.invoke({
    _: 'downloadFile',
    priority: 1,
    file_id: remoteFile.id,
    synchronous: false,
  });
  let isDownloaded = false;
  while (!isDownloaded) {
    // eslint-disable-next-line no-await-in-loop
    await delay(1000);
    // eslint-disable-next-line no-await-in-loop
    const checkDownloadedRes = await bot.tdlib.invoke({
      _: 'getFile',
      file_id: remoteFile.id,
    });
    if (checkDownloadedRes.local.is_downloading_completed) {
      isDownloaded = true;
      log.debug('async path is', checkDownloadedRes.local.path);
    }
  }
  const remoteFileSync = await bot.tdlib.invoke({
    _: 'getRemoteFile',
    remote_file_id: photos.photos[0][1].file_id,
  });
  const resSyncDownload = await bot.tdlib.invoke({
    _: 'downloadFile',
    priority: 1,
    file_id: remoteFileSync.id,
    synchronous: true,
  });
  log.debug('sync path is', resSyncDownload.local.path);
  // download file test end

  const res = await bot.telegram.sendMessage(
    debugChatId,
    `I'm started on ${stage} in debug mode 🙈\n\n/ping\n/chatid\n/test`,
  );
  // log.debug('sendMessage', res);
}

main().catch(log.fatal.bind(log));
