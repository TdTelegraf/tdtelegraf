/* eslint-disable @typescript-eslint/no-namespace */
import { stage } from '@lskjs/env';
import { getEnvConfig, Logger } from '@lskjs/log';
import pTimeout from 'p-timeout';
import { Context, Telegram } from 'telegraf';
// import { Opts } from 'telegraf/types';
import { Opts, Typegram } from 'typegram';

import { LskTelegraf } from './LskTelegraf';

const isDebug = stage === 'ga2mer';
// telegraf input file definition
interface InputFileByPath {
  source: string;
  filename?: string;
}
interface InputFileByReadableStream {
  source: NodeJS.ReadableStream;
  filename?: string;
}
interface InputFileByBuffer {
  source: Buffer;
  filename?: string;
}
interface InputFileByURL {
  url: string;
  filename?: string;
}
export type InputFile =
  | InputFileByPath
  | InputFileByReadableStream
  | InputFileByBuffer
  | InputFileByURL;

// typegram proxy type setup
type TelegrafTypegram = Typegram<InputFile>;

export type TelegramType = TelegrafTypegram['Telegram'];
const log = new Logger({
  ns: 'telegram',
  ...getEnvConfig(),
  level: 'error',
});

export interface CallApiOptions {
  signal?: AbortSignal;
}

function always<T>(x: T) {
  return () => x;
}

const anoop = always(Promise.resolve());

export class LskTelegram extends Telegram {
  telegraf: LskTelegraf;
  constructor(telegraf, ...otherArgs: [any, any, any]) {
    super(...otherArgs);
    this.telegraf = telegraf;
  }
  // @ts-ignore
  async callApi<M extends keyof TelegramType>(
    method: M,
    payload: Opts<M>,
    { signal }: CallApiOptions = {},
  ): Promise<ReturnType<TelegramType[M]>> {
    log.trace('LskTelegram.callApi start', { method, payload, signal });
    // @ts-ignore
    const res: any = await super.callApi<M>(method, payload, { signal });
    //
    log.trace('LskTelegram.callApi finish', { method, payload, signal, res });

    if (!isDebug) {
      const update: any = {
        update_id: -1,
        message: res,
      };

      // @ts-ignore
      const ctx = new Context(update, this, this.telegraf.botInfo);
      // @ts-ignore
      ctx.callApiOptions = {
        method,
        payload,
        res,
      };
      try {
        // @ts-ignore
        await pTimeout(Promise.resolve(this.telegraf.middlewareOut()(ctx, anoop)), 90000);
      } catch (err) {
        // @ts-ignore
        return await this.telegraf.handleError(err, ctx);
      } finally {
        log.debug('Finished processing update', update.update_id);
      }
    } else if (isDebug) {
      // TODO: это делаем в будущем
      if (method === 'sendMessage') {
        const update: any = {
          update_id: -1,
          message: res,
        };
        // @ts-ignore
        const ctx = new Context(update, this, this.telegraf.botInfo);
        try {
          // @ts-ignore
          await pTimeout(Promise.resolve(this.telegraf.middlewareOut()(ctx, anoop)), 90000);
        } catch (err) {
          // @ts-ignore
          return await this.telegraf.handleError(err, ctx);
        } finally {
          log.debug('Finished processing update', update.update_id);
        }
      }
    }

    return res as ReturnType<TelegramType[M]>;
  }
}

export default LskTelegram;
