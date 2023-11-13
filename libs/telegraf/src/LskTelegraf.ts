/* eslint-disable consistent-return */
import { getEnvConfig, Logger } from '@lskjs/log';
// import * as tg from '/core/types/typegram'
import * as http from 'http';
import pTimeout from 'p-timeout';
import { Context, Telegraf } from 'telegraf';
import { Update } from 'typegram';

import { compactOptions } from './core/helpers/compact';
import LskTelegram from './LskTelegram';
import { waitFn } from './utils/utils';

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
  constructor(token: string, options?: any) {
    super(token, options); // TODO: подумать надо ли тут дергать super
    // @ts-expect-error Trust me, TS
    this.options = {
      ...DEFAULT_OPTIONS,
      ...compactOptions(options),
    };
    // @ts-ignore
    this.telegram = new LskTelegram(token, this.options.telegram);
    log.debug('Created a `Telegraf` instance');
  }

  /**
   * NOTE: метод скопирован и добавлен await для this.botInfo && this.polling?.abortController,
   */
  async launch(config: Telegraf.LaunchOptions = {}) {
    log.debug('Connecting to Telegram');
    this.botInfo ??= await this.telegram.getMe();
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
    const tg = new LskTelegram(this.token, this.telegram.options, webhookResponse);
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
}

export default LskTelegraf;
