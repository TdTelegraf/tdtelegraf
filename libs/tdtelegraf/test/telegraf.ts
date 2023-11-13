// import { Logger } from '@lskjs/log';
import { log } from '@lskjs/log/log';
import { LskTelegraf } from '@lskjs/telegraf';
import { delay } from 'fishbird';
import { message } from 'telegraf/filters';

import { onChatIdCommand } from './commands/onChatIdCommand';
import { onPingCommand } from './commands/onPingCommand';
import { onTestCommand } from './commands/onTestCommand';
import { botClientLoggerMiddleware, logOutcomingMessage, patchBotClient } from './commands/utils';
import { debugChatId, telegrafOptions } from './config';

async function main() {
  const bot = new LskTelegraf(telegrafOptions.token);

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
  bot.use(botClientLoggerMiddleware);
  bot.useOut((ctx, next) => {
    console.log('outgoing message', ctx.message);
    return next();
  });
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
