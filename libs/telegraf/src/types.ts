// import { Message as TelegrafMessage } from 'telegraf/types';
import { Context } from 'telegraf';

export type Message = any; // TelegrafMessage.CommonMessage;
export type Ctx = any;

export type DbService = {
  hasUser: (filter: { botId: string; userId: string }) => boolean;
  upsertUser: (filter: { botId: string; userId: string }, $set: any) => Promise<any>;
  hasChat: (filter: { botId: string; chatId: string }) => boolean;
  upsertChat: (filter: { botId: string; chatId: string }, $set: any) => Promise<any>;
  upsertMessage: (
    filter: { botId: string; chatId: string; messageId: string },
    $set: any,
  ) => Promise<any>;
  upsertDialog: (filter: { botId: string; chatId: string }, $set: any) => Promise<any>;
  eventEmitter: any;
};

export type MiddlewareFn<C extends Context> = (
  ctx: C,
  next: () => Promise<void>,
) => Promise<unknown> | void;

export interface MiddlewareObj<C extends Context> {
  middleware: () => MiddlewareFn<C>;
}

export type Middleware<C extends Context> = MiddlewareFn<C> | MiddlewareObj<C>;
