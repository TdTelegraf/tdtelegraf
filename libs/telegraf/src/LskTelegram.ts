/* eslint-disable @typescript-eslint/no-namespace */
import { getEnvConfig, Logger } from '@lskjs/log';
import { Telegram } from 'telegraf';
// import { Opts } from 'telegraf/types';
import { Opts, Telegram as TelegramType } from 'typegram';

const log = new Logger({
  ns: 'telegram',
  ...getEnvConfig(),
  level: 'error',
});

export interface CallApiOptions {
  signal?: AbortSignal;
}

export class LskTelegram extends Telegram {
  // @ts-ignore
  async callApi<M extends keyof TelegramType>(
    method: M,
    payload: Opts<M>,
    { signal }: CallApiOptions = {},
  ): Promise<ReturnType<TelegramType[M]>> {
    log.trace('LskTelegram.callApi start', { method, payload, signal });
    // @ts-ignore
    const res = await super.callApi<M>(method, payload, { signal });
    //
    log.trace('LskTelegram.callApi finish', { method, payload, signal });

    return res as ReturnType<TelegramType[M]>;
  }
}

export default LskTelegram;
