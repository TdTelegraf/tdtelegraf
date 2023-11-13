/* eslint-disable @typescript-eslint/no-namespace */
import { getEnvConfig, Logger } from '@lskjs/log';
import * as http from 'http';
import { Telegram } from 'telegraf';
import { Opts } from 'telegraf/types';

const log = new Logger({
  ns: 'telegram',
  ...getEnvConfig(),
  level: 'error',
});

namespace ApiClient {
  export type Agent = http.Agent | ((parsedUrl: URL) => http.Agent) | undefined;
  export interface Options {
    /**
     * Agent for communicating with the bot API.
     */
    agent?: http.Agent;
    /**
     * Agent for attaching files via URL.
     * 1. Not all agents support both `http:` and `https:`.
     * 2. When passing a function, create the agents once, outside of the function.
     *    Creating new agent every request probably breaks `keepAlive`.
     */
    attachmentAgent?: Agent;
    apiRoot: string;
    /**
     * @default 'bot'
     * @see https://github.com/tdlight-team/tdlight-telegram-bot-api#user-mode
     */
    apiMode: 'bot' | 'user';
    webhookReply: boolean;
    testEnv: boolean;
  }

  export interface CallApiOptions {
    signal?: AbortSignal;
  }
}

export class LskTelegram extends Telegram {
  async callApi<M extends keyof Telegram>(
    method: M,
    payload: Opts<M>,
    { signal }: ApiClient.CallApiOptions = {},
  ): Promise<ReturnType<Telegram[M]>> {
    log.trace('LskTelegram.callApi start', { method, payload, signal });
    const res = await super.callApi<M>(method, payload, { signal });
    //
    log.trace('LskTelegram.callApi finish', { method, payload, signal });

    return res;
  }
}

export default LskTelegram;
