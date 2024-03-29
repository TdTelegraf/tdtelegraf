/* eslint-disable consistent-return */
import { getEnvConfig, Logger } from '@lsk4/log';
// import * as tg from '/core/types/typegram'
import * as http from 'http';
import pTimeout from 'p-timeout';
import { Composer, Context, Telegraf } from 'telegraf';
import { Update } from 'typegram';

import { compactOptions } from './core/helpers/compact';
import LskTelegram from './LskTelegram';
import { MiddlewareFn } from './types';
import { waitFn } from './utils/waitFn';

// export type OutMiddlewareOptions = {
//   method: string;
//   payload: any;
//   res: any;
//   subRes?: any;
//   i?: number;
// };

// export type OutMiddlewareFn<C extends Context> = (
//   ctx: C,
//   next: () => Promise<void>,
//   options: OutMiddlewareOptions,
// ) => Promise<unknown> | void;

const DEFAULT_OPTIONS: Telegraf.Options<Context> = {
  telegram: {},
  handlerTimeout: 90_000, // 90s in ms
  contextType: Context,
};

function always<T>(x: T) {
  return () => x;
}

const anoop = always(Promise.resolve());

const log = new Logger({
  ns: 'telegraf',
  ...getEnvConfig(),
  level: 'error',
});

export class LskTelegraf extends Telegraf {
  /**
   * NOTE: метод скопирован и заменен Telegram на LskTelegram
   */
  // Partial<Telegraf.Options<C>
  private handlerOut: MiddlewareFn<Context>;
  public middlewareOut: () => MiddlewareFn<Context>;
  constructor(token: string, options?: any) {
    super(token, options); // TODO: подумать надо ли тут дергать super
    // @ts-expect-error Trust me, TS
    this.options = {
      ...DEFAULT_OPTIONS,
      ...compactOptions(options),
    };
    // @ts-ignore
    this.telegram = new LskTelegram(this, token, this.options.telegram);
    this.handlerOut = Composer.compose([]);
    // поменять на метод в классе
    this.middlewareOut = () => this.handlerOut;
    log.debug('Created a `Telegraf` instance');
  }
  // middlewareOut() {
  //   return this.handlerOut;
  // }

  /**
   * NOTE: метод скопирован и добавлен await для this.botInfo && this.polling?.abortController,
   */
  async launch(config: Telegraf.LaunchOptions = {}) {
    log.debug('Connecting to Telegram');
    this.botInfo ??= await this.telegram.getMe();
    // console.log('this.botInfo', this.botInfo);
    log.debug(`Launching @${this.botInfo.username}`);

    if (config.webhook === undefined) {
      await this.telegram.deleteWebhook({
        drop_pending_updates: config.dropPendingUpdates,
      });
      log.debug(`Bot starting with long polling @${this.botInfo.username}`);
      // @ts-ignore
      this.startPolling(config.allowedUpdates);
      await waitFn(
        () =>
          // @ts-ignore
          this.botInfo && this.polling?.abortController,
        10,
        10000,
      );
      log.info(`Bot started with long polling @${this.botInfo.username}`);

      return;
    }

    // @ts-ignore
    if (config.webhook.url) {
      // @ts-ignore
      await this.telegram.setWebhook(config.webhook.url, {
        drop_pending_updates: config.dropPendingUpdates,
        allowed_updates: config.allowedUpdates,
        ip_address: config.webhook.ipAddress,
        max_connections: config.webhook.maxConnections,
        secret_token: config.webhook.secretToken,
        certificate: config.webhook.certificate,
      });
      // @ts-ignore
      log.debug(`Bot started with webhook @ ${config.webhook.url}`);
      return;
    }

    // @ts-ignore
    const domainOpts = this.getDomainOpts({
      domain: config.webhook.domain,
      path: config.webhook.hookPath,
    });

    const { tlsOptions, port, host, cb, secretToken } = config.webhook;

    // @ts-ignore
    this.startWebhook(domainOpts.path, tlsOptions, port, host, cb, secretToken);

    await this.telegram.setWebhook(domainOpts.url, {
      drop_pending_updates: config.dropPendingUpdates,
      allowed_updates: config.allowedUpdates,
      ip_address: config.webhook.ipAddress,
      max_connections: config.webhook.maxConnections,
      secret_token: config.webhook.secretToken,
      certificate: config.webhook.certificate,
    });

    log.debug(`Bot started with webhook @ ${domainOpts.url}`);
  }

  /**
   * NOTE: метод скопирован и добавлен await для this.polling.abortController?.signal?.aborted
   */
  async stop(reason = 'unspecified'): Promise<void> {
    log.trace('Stopping bot... Reason:', reason);

    // @ts-ignore
    if (!this.polling && !this.webhookServer) {
      log.warn('Bot is not running');
    }
    // @ts-ignore
    if (this.polling) {
      // @ts-ignore
      this.polling.stop();
      // @ts-ignore
      await waitFn(() => this.polling.abortController?.signal?.aborted, 10, 10000);
    }
    // @ts-ignore
    if (this.webhookServer) {
      // @ts-ignore
      this.webhookServer?.close();
    }
  }
  async useOut(...fns: ReadonlyArray<MiddlewareFn<Context>>) {
    // @ts-ignore
    this.handlerOut = Composer.compose([this.handlerOut, ...fns]);
    return this;
  }

  /**
   * NOTE: метод скопирован и заменен Telegram на LskTelegram
   */
  // @ts-ignore
  async handleUpdate(update: Update, webhookResponse?: http.ServerResponse) {
    this.botInfo ??=
      (log.debug('Update %d is waiting for `botInfo` to be initialized', update.update_id),
      // @ts-ignore
      await (this.botInfoCall ??= this.telegram.getMe()));
    log.debug('Processing update', update.update_id);
    // @ts-ignore
    const tg = new LskTelegram(this, this.token, this.telegram.options, webhookResponse);
    // @ts-ignore
    const TelegrafContext = this.options.contextType;
    const ctx = new TelegrafContext(update, tg, this.botInfo);
    Object.assign(ctx, this.context);
    try {
      // @ts-ignore
      await pTimeout(Promise.resolve(this.middleware()(ctx, anoop)), this.options.handlerTimeout);
    } catch (err) {
      // @ts-ignore
      return await this.handleError(err, ctx);
    } finally {
      if (webhookResponse?.writableEnded === false) {
        webhookResponse.end();
      }
      log.debug('Finished processing update', update.update_id);
    }
  }
  async handleUpdateOut(ctx: Context) {
    log.debug('Processing out update', ctx.update.update_id);
    try {
      // @ts-ignore
      await pTimeout(Promise.resolve(this.middlewareOut()(ctx, anoop)), 90000);
    } catch (err) {
      // @ts-ignore
      return await this.handleError(err, ctx);
    } finally {
      log.debug('Finished processing out update', ctx.update.update_id);
    }
  }
}

export default LskTelegraf;
