/* eslint-disable @typescript-eslint/no-namespace */
import { getEnvConfig, Logger } from '@lskjs/log';
import { Telegram } from 'telegraf';
// import { Opts } from 'telegraf/types';
import { Opts, Typegram } from 'typegram';

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
