import Readline from 'node:readline/promises';

// import { Logger } from '@lskjs/log';
import { log } from '@lskjs/log/log';
import { delay } from 'fishbird';
import { message } from 'telegraf/filters';

import { TdTelegraf } from '../src/TdTelegraf';
import { onChatIdCommand } from './commands/onChatIdCommand';
import { onPingCommand } from './commands/onPingCommand';
import { onTestCommand } from './commands/onTestCommand';
import { botClientLoggerMiddleware, logOutcomingMessage, patchBotClient } from './commands/utils';
import { accountPhone, databaseDirectory, debugChatId, filesDirectory, tdlOptions } from './config';

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
          log.warn('getAuthCode');
          return rl.question('Auth code: ');
        },
        async getPassword() {
          log.warn('getAuthCode');
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

  // NOTE: Default rxample from lskjs tutorial
  patchBotClient(bot, async (method, ctx, args, res) => {
    logOutcomingMessage(method, ctx, args, res);
    // await saveOutcomingMessage(this, method, ctx, args, res);
  });
  const startDate = new Date();
  bot.use((ctx, next) => {
    if (startDate > new Date(ctx.message.date * 1000)) return false;
    return next();
  });
  bot.use(botClientLoggerMiddleware);
  bot.command('ping', onPingCommand);
  bot.command('chatid', onChatIdCommand);

  // NOTE: custom example for debug TdTelegraf
  bot.command('test', onTestCommand);
  bot.catch((err) => {
    log.error('bot.catch', err);
  });

  await bot.launch();
  await delay(3000); // TODO: если убрать delay, то не работает sendMessage
  const res = await bot.telegram.sendMessage(debugChatId, "I'm started in debug mode 🙈");
  log.debug('sendMessage', res);
}

main().catch(log.fatal.bind(log));
