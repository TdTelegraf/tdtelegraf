import { createLogger } from '@lskjs/log';

import { SaveService } from './types';

const log = createLogger({
  ns: 'saveServiceMock',
  level: 'error',
});

// eslint-disable-next-line no-shadow
export const createSaveServiceMock = ({ log, has = true }): SaveService => ({
  hasUser: (filter) => {
    // log.debug('hasUser', filter);
    return has;
  },
  hasChat: (filter) => {
    // log.debug('hasChat', filter);
    return has;
  },
  upsertUser: async (filter, data) => {
    // log.debug('upsertUser', filter, Object.keys(data));
    // log.trace('upsertChat', data);
  },
  upsertChat: async (filter, data) => {
    // log.debug('upsertChat', filter, Object.keys(data).join(','));
    // log.trace('upsertChat', data);
  },
  upsertMessage: async (filter, data) => {
    // log.debug('upsertMessage', filter, Object.keys(data).join(','));
    // log.trace('upsertMessage', data);
  },
  upsertDialog: async (filter, data) => {
    // log.debug('upsertDialog', filter, Object.keys(data).join(','));
    // log.trace('upsertDialog', data);
  },
  eventEmitter: {
    emit: (event, data) => {
      const filter = { botId: data.botId, chatId: data.chatId, event: data.event };
      // log.debug('eventEmitter.emit', event, filter, Object.keys(data).join(','));
      // log.trace('eventEmitter.emit', data);
    },
  },
});

export const saveServiceMock: SaveService = createSaveServiceMock({ log });
