import Readline from 'node:readline/promises';

// import { Logger } from '@lskjs/log';
import { log } from '@lskjs/log/log';
import { delay } from 'fishbird';

import { TdTelegraf } from '../src/TdTelegraf';
import { accountPhone, databaseDirectory, debugChatId, filesDirectory, tdlOptions } from './config';

async function main() {
  const rl = Readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const client = new TdTelegraf({
    ...tdlOptions,
    databaseDirectory,
    filesDirectory,
    async onStop() {
      await client.stop();
      log.warn('client.stop');
    },
    async onLaunch() {
      await client.tdlib.login(() => ({
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
  await client.launch();
  await delay(10000);
  const res = await client.tdlib.invoke({
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
  log.debug('sendMessage', res);
}

main().catch(log.fatal.bind(log));
