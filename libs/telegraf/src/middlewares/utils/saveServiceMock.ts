import { createLogger } from '@lskjs/log';

import { SaveService } from './types';

const log = createLogger('saveServiceMock');
export const saveServiceMock: SaveService = {
  hasUser: async (filter) => {
    log.debug('hasUser', filter);
    return false;
  },
  hasChat: async (filter) => {
    log.debug('hasChat', filter);
    return false;
  },
  upsertUser: async (filter, data) => {
    log.debug('upsertUser', filter, data);
  },
  upsertChat: async (filter, data) => {
    log.debug('upsertChat', filter, data);
  },
  upsertMessage: async (filter, data) => {
    log.debug('upsertMessage', filter, data);
  },
  upsertDialog: async (filter, data) => {
    log.debug('upsertDialog', filter, data);
  },
  eventEmitter: {
    emit: (event, data) => {
      log.debug('eventEmitter.emit', event, data);
    },
  },
};
