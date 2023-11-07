import { mkdirSync } from 'node:fs';
import Readline from 'node:readline/promises';

import { log } from '@lskjs/log/log';
import { Client } from 'tdl';
import { TDLib } from 'tdl-tdlib-addon';

import {
  accountPhone,
  databaseDirectory,
  debugChatId,
  filesDirectory,
  tdlibPath,
  tdlOptions,
} from './config';

// const log = new Logger({ ns: 'tdlib', level: (process.env.LOG_LEVEL || 'debug') as any });
const tdlib = new TDLib(tdlibPath);

const rl = Readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

mkdirSync(filesDirectory, { recursive: true });
mkdirSync(databaseDirectory, { recursive: true });
const client = new Client(tdlib, {
  ...tdlOptions,
  databaseDirectory,
  filesDirectory,
});

const main = async () => {
  await client.login(() => ({
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

  const res2 = await client.invoke({
    _: 'sendMessage',
    chat_id: debugChatId,
    input_message_content: {
      _: 'inputMessageText',
      text: {
        _: 'formattedText',
        text: '👻',
      },
    },
  });
  log.debug('sendMessage', res2);

  //   console.log({ res2 });

  //   const res = await client.invoke({
  //     _: 'sendMessage',
  //     // chat_id: 36783752,
  //     // chat_id: 80081115,
  //     chat_id: -922668292,
  //     input_message_content: {
  //       _: 'inputMessageText',
  //       text: {
  //         _: 'formattedText',
  //         text: '👻',
  //       },
  //     },
  //   });
  //   log.trace('sendMessage', res);

  //   const res2 = await client.invoke({
  //     _: 'sendMessage',
  //     chat_id: debugUserId,
  //     input_message_content: {
  //       _: 'inputMessageText',
  //       text: {
  //         _: 'formattedText',
  //         text: '👻',
  //       },
  //     },
  //   });
  //   console.log({ res2 });
};

function onUpdate(update) {
  log.debug('New update:', JSON.stringify(update, null, 2));
}
client.on('update', onUpdate);
client.on('error', log.error.bind(log));
// log.tra({ client }, 123);
main().catch(log.fatal.bind(log));
