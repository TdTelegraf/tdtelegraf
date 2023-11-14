// import { Logger } from '@lskjs/log';
import { stage } from '@lskjs/env';
import { log } from '@lskjs/log/log';
import { LskTelegraf } from '@lskjs/telegraf';
import { onChatIdCommand, onPingCommand, onTestCommand } from '@lskjs/telegraf/commands';
import {
  ignoreMiddleware,
  loggerMiddleware,
  loggerOutMiddleware,
} from '@lskjs/telegraf/middlewares';
import { message } from 'telegraf/filters';

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

  // // NOTE: Default rxample from @lskjs/telegraf tutorial
  bot.useOut(loggerOutMiddleware);
  // bot.useOut(saveOutMiddleware);

  bot.use(loggerMiddleware);
  bot.use(ignoreMiddleware);
  // bot.use(saveMiddleware);
  bot.command('ping', onPingCommand);
  bot.command('chatid', onChatIdCommand);

  // NOTE: custom example for debug TdTelegraf
  bot.command('test', onTestCommand);

  //
  bot.catch((err) => {
    log.error('bot.catch', err);
  });
  await bot.launch();
  const res = await bot.telegram.sendMessage(
    debugChatId,
    `I'm started on ${stage} in debug mode 🙈`,
  );
  log.debug('sendMessage', res);
}

main().catch(log.fatal.bind(log));
